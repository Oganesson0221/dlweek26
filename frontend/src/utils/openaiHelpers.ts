import OpenAI from "openai";

// Initialize OpenAI client - lazy initialization to avoid errors on load
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const getOpenAIClient = () => {
  if (!apiKey) {
    console.warn(
      "VITE_OPENAI_API_KEY is not set. OpenAI features will use fallback responses.",
    );
    return null;
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, you should proxy through your backend
  });
};

const openai = getOpenAIClient();

// Rate limiting and token tracking
let totalTokensUsed = 0;
const MAX_TOKENS_PER_SESSION = 100000; // Adjust based on your budget

export const openAIConfig = {
  model: "gpt-4-turbo-preview", // or 'gpt-3.5-turbo' for cheaper option
  maxTokens: 4000,
  temperature: 0.3,
};

// Track token usage
export function trackTokenUsage(tokens: number) {
  totalTokensUsed += tokens;
  console.log(`Total tokens used this session: ${totalTokensUsed}`);

  if (totalTokensUsed > MAX_TOKENS_PER_SESSION) {
    console.warn(
      "Token limit approaching, consider switching to cheaper model",
    );
  }
}

// Generic function to call OpenAI with error handling
export async function callOpenAI(
  prompt: string,
  systemPrompt: string = "You are a helpful academic assistant.",
  model: string = openAIConfig.model,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: openAIConfig.maxTokens,
      temperature: openAIConfig.temperature,
    });

    const content = response.choices[0]?.message?.content || "";

    // Track token usage
    if (response.usage) {
      trackTokenUsage(response.usage.total_tokens);
    }

    return content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

// Function to extract text from PDF using OpenAI's vision (for PDFs with images)
export async function extractTextFromPDFWithOpenAI(
  file: File,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = (e.target?.result as string).split(",")[1];

        // For PDFs, we'll use GPT-4 Vision if it's an image-based PDF
        // Otherwise, we'll extract text directly
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text content from this document. Focus on course information, assignments, rubrics with point values, due dates, and submission guidelines. Return the text in a clean, structured format.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.type};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
        });

        resolve(response.choices[0].message.content || "");
      } catch (error) {
        console.error("Vision API error:", error);
        // Fallback: try to extract text directly
        try {
          const text = await file.text();
          resolve(text);
        } catch {
          reject(error);
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

// Parse course outline with OpenAI
export async function parseCourseOutlineWithOpenAI(file: File): Promise<any> {
  const extractedText = await extractTextFromPDFWithOpenAI(file);

  const parsePrompt = `Parse this course syllabus/outline into a structured JSON object. Extract the following:

{
  "courseName": "Full course name",
  "courseCode": "Course code (e.g., CS101)",
  "instructor": "Instructor name",
  "instructorEmail": "Instructor email if found",
  "semester": "Semester/term",
  "description": "Course description",
  "components": [
    {
      "name": "Assignment/component name",
      "type": "assignment/quiz/project/presentation/lab/exam",
      "weight": number (percentage, must be a number without % sign),
      "dueDate": "Due date if specified (format: YYYY-MM-DD)",
      "description": "Detailed description",
      "learningObjectives": ["objective1", "objective2"],
      "rubric": [
        {
          "criteria": "Grading criteria name",
          "points": number (points possible),
          "description": "Description of criteria",
          "excellent": "Description of excellent work",
          "good": "Description of good work",
          "fair": "Description of fair work",
          "poor": "Description of poor work"
        }
      ],
      "submissionGuidelines": ["guideline1", "guideline2"],
      "resources": ["resource1", "resource2"]
    }
  ],
  "gradingPolicy": "Overall grading policy",
  "latePolicy": "Late submission policy"
}

Important: 
- Return ONLY the JSON object, no other text
- Ensure all numeric values are numbers, not strings
- If information is not found, use empty strings or arrays
- Weights should sum to 100

Text to parse:
${extractedText}`;

  try {
    const result = await callOpenAI(
      parsePrompt,
      "You are an expert at parsing academic documents into structured JSON. Extract information accurately and return valid JSON only.",
      "gpt-4-turbo-preview", // Use GPT-4 for better accuracy
    );

    // Extract JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate weights sum to approximately 100
      const totalWeight =
        parsed.components?.reduce(
          (sum: number, c: any) => sum + (Number(c.weight) || 0),
          0,
        ) || 0;
      if (Math.abs(totalWeight - 100) > 5) {
        console.warn(`Weights sum to ${totalWeight}, expected ~100`);
      }

      return parsed;
    }
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Failed to parse with OpenAI:", error);
    throw error;
  }
}

// Generate assignment template with proper formatting
export async function generateAssignmentTemplateWithOpenAI(
  component: any,
  courseInfo: { name: string; code: string; instructor: string },
): Promise<string> {
  const prompt = `Create a detailed, professionally formatted assignment template for:

Course: ${courseInfo.name} (${courseInfo.code})
Instructor: ${courseInfo.instructor}
Assignment: ${component.name}
Type: ${component.type}
Weight: ${component.weight}%

Description: ${component.description || "No description provided"}

Learning Objectives:
${component.learningObjectives?.map((o: string) => `- ${o}`).join("\n") || "- No specific objectives"}

Rubric:
${
  component.rubric
    ?.map(
      (r: any) =>
        `- ${r.criteria}: ${r.points} points
   Description: ${r.description}
   Excellent: ${r.excellent || "Exceeds expectations"}
   Good: ${r.good || "Meets expectations"}
   Fair: ${r.fair || "Partially meets expectations"}
   Poor: ${r.poor || "Does not meet expectations"}`,
    )
    .join("\n\n") || "- No rubric provided"
}

Submission Guidelines:
${component.submissionGuidelines?.map((g: string) => `- ${g}`).join("\n") || "- Follow standard submission procedures"}

Create a Word-compatible document with:
1. Professional header with course info and student details section
2. Assignment overview and objectives
3. Detailed instructions
4. Rubric table in markdown format with criteria, points, and descriptions
5. Submission checklist
6. Grading section with space for feedback

Format as plain text with markdown-style tables that can be easily converted to Word.`;

  return callOpenAI(
    prompt,
    "You are an expert at creating academic assignment templates. Create clear, well-structured templates that work in Microsoft Word.",
    "gpt-4-turbo-preview",
  );
}

// Generate submission guidelines
export async function generateSubmissionGuidelinesWithOpenAI(
  outline: any,
): Promise<string> {
  const componentsList = outline.components
    .map(
      (c: any) =>
        `${c.name} (${c.type}) - ${c.weight}%\n` +
        `Guidelines: ${c.submissionGuidelines?.join(", ") || "Standard"}\n` +
        `Rubric: ${c.rubric?.map((r: any) => `${r.criteria} (${r.points} pts)`).join(", ") || "Standard"}`,
    )
    .join("\n\n");

  const prompt = `Create comprehensive submission guidelines for:

Course: ${outline.courseName} (${outline.courseCode})
Instructor: ${outline.instructor}
Semester: ${outline.semester || "Current"}

Components:
${componentsList}

Grading Policy: ${outline.gradingPolicy || "Standard grading"}
Late Policy: ${outline.latePolicy || "10% per day late"}

Generate a detailed document with:
1. General submission policies (file formats, naming conventions, deadlines)
2. Component-specific requirements
3. Formatting guidelines
4. Rubric summaries
5. Common mistakes to avoid
6. Checklist before submission
7. Resources and support

Format as well-structured markdown with tables and sections.`;

  return callOpenAI(
    prompt,
    "You are creating submission guidelines for students. Be clear, detailed, and helpful.",
    "gpt-4-turbo-preview",
  );
}

// Generate confirmation email
export async function generateEmailWithOpenAI(
  assignment: any,
  professorName: string,
): Promise<{ subject: string; body: string }> {
  const prompt = `Generate a professional email to Professor ${professorName} confirming submission of "${assignment.title}" for ${assignment.courseCode}.

Include:
- Polite greeting
- Confirmation of submission
- Assignment details
- ${assignment.score ? `Score received: ${assignment.score}/${assignment.maxScore}` : "Request for feedback"}
- Offer to provide additional information
- Professional closing

Return as JSON with "subject" and "body" fields. Body should be plain text with proper line breaks.`;

  try {
    const result = await callOpenAI(
      prompt,
      "You are a polite university student writing professional emails.",
      "gpt-3.5-turbo",
    );
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Email generation failed:", error);
  }

  // Fallback
  return {
    subject: `Submission Confirmation: ${assignment.title} (${assignment.courseCode})`,
    body: `Dear Professor ${professorName},

I am writing to confirm that I have submitted "${assignment.title}" for ${assignment.courseCode}.

${assignment.score ? `I received a score of ${assignment.score}/${assignment.maxScore}. ` : ""}Please let me know if you need any additional information.

Thank you,
[Your Name]`,
  };
}
