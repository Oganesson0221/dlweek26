import {
  Topic,
  StudyCommit,
  LearningBranch,
  PullRequest,
  BlameEntry,
  ContributionDay,
  StreakInfo,
} from "@/types";

// ─── Topics ───
export const topics: Topic[] = [
  {
    id: "t1",
    name: "Linear Algebra",
    color: "#0078d4",
    mastery: 92,
    masteryLevel: "mastered",
    totalCommits: 18,
    totalTimeMinutes: 540,
  },
  {
    id: "t2",
    name: "Neural Networks",
    color: "#9b59b6",
    mastery: 78,
    masteryLevel: "proficient",
    totalCommits: 24,
    totalTimeMinutes: 720,
  },
  {
    id: "t3",
    name: "Calculus",
    color: "#107c10",
    mastery: 85,
    masteryLevel: "proficient",
    totalCommits: 15,
    totalTimeMinutes: 450,
  },
  {
    id: "t4",
    name: "Probability & Stats",
    color: "#ffb900",
    mastery: 64,
    masteryLevel: "developing",
    totalCommits: 12,
    totalTimeMinutes: 360,
  },
  {
    id: "t5",
    name: "NLP",
    color: "#e74c3c",
    mastery: 45,
    masteryLevel: "developing",
    totalCommits: 8,
    totalTimeMinutes: 240,
  },
  {
    id: "t6",
    name: "Reinforcement Learning",
    color: "#00b4d8",
    mastery: 32,
    masteryLevel: "beginner",
    totalCommits: 5,
    totalTimeMinutes: 150,
  },
];

// ─── Commits ───
export const commits: StudyCommit[] = [
  {
    id: "c1",
    hash: "a3f8b2c",
    topic: "t2",
    topicName: "Neural Networks",
    branch: "b2",
    message: "feat: Complete backpropagation exercises",
    date: "2026-02-28T14:30:00Z",
    timeSpentMinutes: 45,
    scoreImprovement: 8,
    scoreBefore: 70,
    scoreAfter: 78,
    type: "practice",
    notes:
      "Finally understood chain rule application in deep networks. Key insight: gradient flows backwards through computation graph.",
    difficulty: 4,
    mistakes: ["m1"],
  },
  {
    id: "c2",
    hash: "7d2e4f1",
    topic: "t1",
    topicName: "Linear Algebra",
    branch: "b1",
    message: "feat: Master eigenvalue decomposition",
    date: "2026-02-27T10:00:00Z",
    timeSpentMinutes: 60,
    scoreImprovement: 5,
    scoreBefore: 87,
    scoreAfter: 92,
    type: "study",
    notes:
      "Eigenvalues make so much more sense when visualized as scaling factors. Connected to PCA.",
    difficulty: 3,
    mistakes: [],
  },
  {
    id: "c3",
    hash: "b9c1d3e",
    topic: "t2",
    topicName: "Neural Networks",
    branch: "b2",
    message: "fix: Correct vanishing gradient misconception",
    date: "2026-02-26T16:00:00Z",
    timeSpentMinutes: 30,
    scoreImprovement: 4,
    scoreBefore: 66,
    scoreAfter: 70,
    type: "review",
    notes:
      "Was confusing vanishing gradient with exploding gradient. ReLU helps with vanishing, gradient clipping with exploding.",
    difficulty: 5,
    mistakes: ["m2", "m3"],
  },
  {
    id: "c4",
    hash: "e5a7c2b",
    topic: "t3",
    topicName: "Calculus",
    branch: "b3",
    message: "feat: Multivariable chain rule practice",
    date: "2026-02-25T09:30:00Z",
    timeSpentMinutes: 40,
    scoreImprovement: 6,
    scoreBefore: 79,
    scoreAfter: 85,
    type: "practice",
    notes:
      "Practiced computing Jacobians. Important for understanding backprop.",
    difficulty: 4,
    mistakes: [],
  },
  {
    id: "c5",
    hash: "f1d8a3c",
    topic: "t4",
    topicName: "Probability & Stats",
    branch: "b4",
    message: "study: Bayesian inference fundamentals",
    date: "2026-02-24T11:00:00Z",
    timeSpentMinutes: 50,
    scoreImprovement: 10,
    scoreBefore: 54,
    scoreAfter: 64,
    type: "study",
    notes:
      "Prior × Likelihood ∝ Posterior. Need more practice with conjugate priors.",
    difficulty: 3,
    mistakes: ["m4"],
  },
  {
    id: "c6",
    hash: "2c4b7e9",
    topic: "t2",
    topicName: "Neural Networks",
    branch: "b2",
    message: "feat: Implement CNN from scratch",
    date: "2026-02-23T15:00:00Z",
    timeSpentMinutes: 90,
    scoreImprovement: 6,
    scoreBefore: 60,
    scoreAfter: 66,
    type: "practice",
    notes:
      "Built a simple CNN. Convolution → ReLU → Pool → FC. Struggled with padding calculations.",
    difficulty: 5,
    mistakes: ["m5"],
  },
  {
    id: "c7",
    hash: "8f3a1d6",
    topic: "t5",
    topicName: "NLP",
    branch: "b5",
    message: "study: Word embeddings and Word2Vec",
    date: "2026-02-22T10:00:00Z",
    timeSpentMinutes: 35,
    scoreImprovement: 15,
    scoreBefore: 30,
    scoreAfter: 45,
    type: "study",
    notes:
      "king - man + woman = queen. CBOW vs Skip-gram. Need to study attention next.",
    difficulty: 3,
    mistakes: [],
  },
  {
    id: "c8",
    hash: "d2e9b4a",
    topic: "t1",
    topicName: "Linear Algebra",
    branch: "b1",
    message: "feat: SVD applications in data compression",
    date: "2026-02-21T13:00:00Z",
    timeSpentMinutes: 55,
    scoreImprovement: 5,
    scoreBefore: 82,
    scoreAfter: 87,
    type: "study",
    notes:
      "SVD = UΣVᵀ. Truncated SVD for dimensionality reduction. Connected to PCA.",
    difficulty: 4,
    mistakes: [],
  },
  {
    id: "c9",
    hash: "5a1c8f3",
    topic: "t6",
    topicName: "Reinforcement Learning",
    branch: "b6",
    message: "study: Q-learning basics and Bellman equation",
    date: "2026-02-20T14:00:00Z",
    timeSpentMinutes: 40,
    scoreImprovement: 12,
    scoreBefore: 20,
    scoreAfter: 32,
    type: "study",
    notes: "Q(s,a) = r + γ max Q(s',a'). Exploration vs exploitation tradeoff.",
    difficulty: 4,
    mistakes: ["m6"],
  },
  {
    id: "c10",
    hash: "c7f2d1b",
    topic: "t3",
    topicName: "Calculus",
    branch: "b3",
    message: "review: Integration techniques refresher",
    date: "2026-02-19T08:30:00Z",
    timeSpentMinutes: 30,
    scoreImprovement: 3,
    scoreBefore: 76,
    scoreAfter: 79,
    type: "review",
    notes:
      "By parts, substitution, partial fractions. Needed for probability distributions.",
    difficulty: 2,
    mistakes: [],
  },
  {
    id: "c11",
    hash: "1b5e9a2",
    topic: "t4",
    topicName: "Probability & Stats",
    branch: "b4",
    message: "study: Maximum likelihood estimation",
    date: "2026-02-18T11:00:00Z",
    timeSpentMinutes: 45,
    scoreImprovement: 8,
    scoreBefore: 46,
    scoreAfter: 54,
    type: "study",
    notes:
      "MLE = argmax L(θ|x). Log-likelihood trick. Connected to loss functions in ML.",
    difficulty: 3,
    mistakes: ["m7"],
  },
  {
    id: "c12",
    hash: "9d4f6c8",
    topic: "t2",
    topicName: "Neural Networks",
    branch: "b2",
    message: "study: Activation functions comparison",
    date: "2026-02-17T16:00:00Z",
    timeSpentMinutes: 25,
    scoreImprovement: 5,
    scoreBefore: 55,
    scoreAfter: 60,
    type: "study",
    notes:
      "Sigmoid → vanishing gradient. ReLU → dead neurons. Leaky ReLU, GELU, Swish.",
    difficulty: 2,
    mistakes: [],
  },
  {
    id: "c13",
    hash: "3e8a2d1",
    topic: "t5",
    topicName: "NLP",
    branch: "b5",
    message: "study: Tokenization and text preprocessing",
    date: "2026-02-16T09:00:00Z",
    timeSpentMinutes: 30,
    scoreImprovement: 10,
    scoreBefore: 20,
    scoreAfter: 30,
    type: "study",
    notes:
      "BPE, WordPiece, SentencePiece. Subword tokenization is key for handling OOV words.",
    difficulty: 2,
    mistakes: [],
  },
  {
    id: "c14",
    hash: "6c1b7f4",
    topic: "t1",
    topicName: "Linear Algebra",
    branch: "b1",
    message: "quiz: Matrix operations assessment",
    date: "2026-02-15T14:00:00Z",
    timeSpentMinutes: 30,
    scoreImprovement: 4,
    scoreBefore: 78,
    scoreAfter: 82,
    type: "quiz",
    notes:
      "Scored 92/100 on matrix multiplication, determinants, and inverse matrices quiz.",
    difficulty: 2,
    mistakes: [],
  },
];

// ─── Branches ───
export const branches: LearningBranch[] = [
  {
    id: "b0",
    name: "main",
    displayName: "Main Learning Path",
    topic: "",
    color: "#64748b",
    status: "active",
    createdDate: "2026-01-01T00:00:00Z",
    lastCommitDate: "2026-02-28T14:30:00Z",
    commits: [],
    parentBranch: "",
    aheadOfMain: 0,
    mergeReady: false,
  },
  {
    id: "b1",
    name: "topic/linear-algebra",
    displayName: "Linear Algebra",
    topic: "t1",
    color: "#0078d4",
    status: "merged",
    createdDate: "2026-02-10T00:00:00Z",
    lastCommitDate: "2026-02-27T10:00:00Z",
    commits: ["c14", "c8", "c2"],
    parentBranch: "main",
    aheadOfMain: 0,
    mergeReady: false,
    aiMergeSuggestion:
      "Mastery at 92%. All core concepts demonstrated. Safe to merge.",
  },
  {
    id: "b2",
    name: "topic/neural-networks",
    displayName: "Neural Networks",
    topic: "t2",
    color: "#9b59b6",
    status: "active",
    createdDate: "2026-02-12T00:00:00Z",
    lastCommitDate: "2026-02-28T14:30:00Z",
    commits: ["c12", "c6", "c3", "c1"],
    parentBranch: "main",
    aheadOfMain: 4,
    mergeReady: false,
    aiMergeSuggestion:
      "At 78% mastery. Recommend completing the attention mechanism module and one more practice session before merging.",
  },
  {
    id: "b3",
    name: "topic/calculus",
    displayName: "Calculus",
    topic: "t3",
    color: "#107c10",
    status: "merged",
    createdDate: "2026-02-08T00:00:00Z",
    lastCommitDate: "2026-02-25T09:30:00Z",
    commits: ["c10", "c4"],
    parentBranch: "main",
    aheadOfMain: 0,
    mergeReady: false,
    aiMergeSuggestion: "Solid foundation at 85%. Merged successfully.",
  },
  {
    id: "b4",
    name: "topic/probability-stats",
    displayName: "Probability & Stats",
    topic: "t4",
    color: "#ffb900",
    status: "active",
    createdDate: "2026-02-14T00:00:00Z",
    lastCommitDate: "2026-02-24T11:00:00Z",
    commits: ["c11", "c5"],
    parentBranch: "main",
    aheadOfMain: 2,
    mergeReady: false,
    aiMergeSuggestion:
      "At 64% mastery — not yet ready. Focus on hypothesis testing and confidence intervals before merging.",
  },
  {
    id: "b5",
    name: "topic/nlp",
    displayName: "NLP",
    topic: "t5",
    color: "#e74c3c",
    status: "active",
    createdDate: "2026-02-15T00:00:00Z",
    lastCommitDate: "2026-02-22T10:00:00Z",
    commits: ["c13", "c7"],
    parentBranch: "main",
    aheadOfMain: 2,
    mergeReady: false,
    aiMergeSuggestion:
      "Still at early stage (45%). Continue through attention mechanisms and transformers before considering merge.",
  },
  {
    id: "b6",
    name: "topic/reinforcement-learning",
    displayName: "Reinforcement Learning",
    topic: "t6",
    color: "#00b4d8",
    status: "active",
    createdDate: "2026-02-18T00:00:00Z",
    lastCommitDate: "2026-02-20T14:00:00Z",
    commits: ["c9"],
    parentBranch: "main",
    aheadOfMain: 1,
    mergeReady: false,
    aiMergeSuggestion:
      "Very early stage (32%). This branch needs significant more work. Consider: policy gradients, SARSA, and DQN.",
  },
];

// ─── Pull Requests ───
export const pullRequests: PullRequest[] = [
  {
    id: "pr1",
    title: "Merge Linear Algebra mastery into main path",
    description:
      "Completed all core linear algebra topics: matrices, eigenvalues, SVD, and their applications to ML.",
    branch: "b1",
    targetBranch: "main",
    status: "merged",
    createdDate: "2026-02-27T12:00:00Z",
    mergedDate: "2026-02-27T14:00:00Z",
    commits: ["c14", "c8", "c2"],
    score: 92,
    aiReview: {
      summary:
        "Excellent mastery of linear algebra fundamentals. Strong connections made to machine learning applications (PCA, SVD for compression). Eigenvalue decomposition fully understood.",
      strengths: [
        "Matrix operations mastered (92/100 quiz score)",
        "SVD connected to practical applications",
        "Eigenvalue intuition well-developed",
        "Consistent study pattern",
      ],
      weaknesses: [
        "Could explore more advanced topics like tensor operations",
        "No practice with sparse matrices",
      ],
      suggestions: [
        "Consider advanced topic: Tensor decomposition for deep learning",
        "Review sparse matrix operations for large-scale ML",
      ],
      readyToMerge: true,
      confidence: 94,
    },
    checksPass: true,
    labels: ["mastered", "foundation", "auto-merged"],
  },
  {
    id: "pr2",
    title: "Merge Calculus fundamentals for ML",
    description:
      "Core calculus for machine learning: chain rule, multivariable calculus, integration, and Jacobians.",
    branch: "b3",
    targetBranch: "main",
    status: "merged",
    createdDate: "2026-02-25T10:00:00Z",
    mergedDate: "2026-02-25T15:00:00Z",
    commits: ["c10", "c4"],
    score: 85,
    aiReview: {
      summary:
        "Strong calculus foundation established. Chain rule and Jacobians well understood — critical for backpropagation. Integration techniques solid.",
      strengths: [
        "Multivariable chain rule connected to backprop",
        "Integration techniques refreshed",
        "Good note-taking habits",
      ],
      weaknesses: [
        "Limited practice with higher-order derivatives",
        "Optimization theory could be deeper",
      ],
      suggestions: [
        "Study: Convex optimization and gradient descent convergence",
        "Practice: Hessian matrices and second-order methods",
      ],
      readyToMerge: true,
      confidence: 87,
    },
    checksPass: true,
    labels: ["proficient", "foundation"],
  },
  {
    id: "pr3",
    title: "PR #3: Neural Networks midterm assessment",
    description:
      "Midterm checkpoint for neural network understanding. Covers: activation functions, backprop, CNNs, gradient issues.",
    branch: "b2",
    targetBranch: "main",
    status: "changes_requested",
    createdDate: "2026-02-28T16:00:00Z",
    commits: ["c12", "c6", "c3", "c1"],
    score: 78,
    aiReview: {
      summary:
        "Good progress on neural networks but some gaps remain. Backpropagation is understood but gradient issues (vanishing/exploding) need more clarity. CNN implementation shows hands-on skills.",
      strengths: [
        "Backpropagation chain rule application correct",
        "CNN implemented from scratch",
        "Good study consistency (4 commits in 11 days)",
      ],
      weaknesses: [
        "Confusion between vanishing and exploding gradients (commit b9c1d3e)",
        "Padding calculations in CNNs still shaky",
        "No attention mechanism coverage yet",
      ],
      suggestions: [
        "Review: Vanishing vs exploding gradients with visual diagrams",
        "Practice: CNN padding/stride calculations worksheet",
        "Next: Study attention mechanisms and transformers",
        "Try: Implement a simple RNN to understand sequential gradient flow",
      ],
      readyToMerge: false,
      confidence: 72,
    },
    checksPass: false,
    labels: ["needs-work", "midterm"],
  },
  {
    id: "pr4",
    title: "PR #4: Probability & Statistics checkpoint",
    description:
      "Initial checkpoint for probability and statistics module. Covers Bayesian inference and MLE.",
    branch: "b4",
    targetBranch: "main",
    status: "open",
    createdDate: "2026-02-28T17:00:00Z",
    commits: ["c11", "c5"],
    score: 64,
    aiReview: {
      summary:
        "Foundations are being built but mastery is insufficient for merge. Bayesian inference basics understood but application is weak. MLE concept grasped but computational practice needed.",
      strengths: [
        "Bayesian inference concept understood",
        "MLE connected to loss functions",
        "Good note-taking with formulas",
      ],
      weaknesses: [
        "Conjugate priors not practiced",
        "Hypothesis testing not covered",
        "Confidence intervals missing",
        "Limited computational practice",
      ],
      suggestions: [
        "Complete: Hypothesis testing module (t-test, chi-square)",
        "Practice: 10 Bayesian inference problems with conjugate priors",
        "Study: Confidence intervals and their interpretation",
        "Add: Computational statistics with Python exercises",
      ],
      readyToMerge: false,
      confidence: 58,
    },
    checksPass: false,
    labels: ["in-progress", "needs-work"],
  },
];

// ─── Blame Entries (Misconceptions) ───
export const blameEntries: BlameEntry[] = [
  {
    id: "m1",
    line: "Gradient computation in multi-layer networks",
    commitHash: "a3f8b2c",
    topic: "Neural Networks",
    mistake:
      "Incorrectly applied chain rule — multiplied activations instead of derivatives",
    frequency: 2,
    lastOccurred: "2026-02-28T14:30:00Z",
    severity: "medium",
    suggestion:
      "Draw the computation graph before computing gradients. Each node should show both forward value and backward derivative.",
    responsible: "Rushed through Calculus chain rule section",
  },
  {
    id: "m2",
    line: "Vanishing gradient problem identification",
    commitHash: "b9c1d3e",
    topic: "Neural Networks",
    mistake:
      "Confused vanishing gradient with exploding gradient — mixed up causes and solutions",
    frequency: 3,
    lastOccurred: "2026-02-26T16:00:00Z",
    severity: "high",
    suggestion:
      "Create a comparison table: Vanishing (sigmoid → ReLU) vs Exploding (deep nets → gradient clipping). Review with visual gradient flow diagrams.",
    responsible: "Insufficient review of activation function properties",
  },
  {
    id: "m3",
    line: "Gradient clipping application",
    commitHash: "b9c1d3e",
    topic: "Neural Networks",
    mistake:
      "Applied gradient clipping when vanishing gradient was the issue — opposite solution",
    frequency: 1,
    lastOccurred: "2026-02-26T16:00:00Z",
    severity: "critical",
    suggestion:
      "Vanishing → change activation (ReLU) or use residual connections. Exploding → gradient clipping or weight regularization.",
    responsible: "Confusion between vanishing/exploding gradients (m2)",
  },
  {
    id: "m4",
    line: "Prior probability selection in Bayesian inference",
    commitHash: "f1d8a3c",
    topic: "Probability & Stats",
    mistake:
      "Used uniform prior when informative prior was appropriate — ignored domain knowledge",
    frequency: 2,
    lastOccurred: "2026-02-24T11:00:00Z",
    severity: "medium",
    suggestion:
      "Always ask: 'What do I already know about this parameter?' If you have domain knowledge, use an informative prior. Uniform = maximum ignorance.",
    responsible: "Tendency to default to 'safe' uninformative priors",
  },
  {
    id: "m5",
    line: "CNN padding and output size calculation",
    commitHash: "2c4b7e9",
    topic: "Neural Networks",
    mistake:
      "Forgot to account for padding when calculating output dimensions — off by 2 in each dimension",
    frequency: 3,
    lastOccurred: "2026-02-23T15:00:00Z",
    severity: "medium",
    suggestion:
      "Memorize: output_size = (input - kernel + 2*padding) / stride + 1. Always write this formula before computing.",
    responsible: "Skipping formula verification step",
  },
  {
    id: "m6",
    line: "Q-learning update rule",
    commitHash: "5a1c8f3",
    topic: "Reinforcement Learning",
    mistake:
      "Used current Q-value instead of max future Q-value in Bellman update",
    frequency: 1,
    lastOccurred: "2026-02-20T14:00:00Z",
    severity: "high",
    suggestion:
      "Q(s,a) ← Q(s,a) + α[r + γ·MAX(Q(s',a')) - Q(s,a)]. The MAX over next state actions is what makes it Q-learning (off-policy).",
    responsible: "New topic — expected for first encounter",
  },
  {
    id: "m7",
    line: "Log-likelihood maximization",
    commitHash: "1b5e9a2",
    topic: "Probability & Stats",
    mistake:
      "Forgot to take the log before differentiating — tried to differentiate product of probabilities directly",
    frequency: 2,
    lastOccurred: "2026-02-18T11:00:00Z",
    severity: "low",
    suggestion:
      "Always convert L(θ) = Π p(xᵢ|θ) to ℓ(θ) = Σ log p(xᵢ|θ) FIRST. Log turns products into sums, making differentiation much easier.",
    responsible: "Skipping algebraic simplification step",
  },
];

// ─── Contribution Graph (last 16 weeks) ───
function generateContributions(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const start = new Date("2025-11-10");
  const end = new Date("2026-03-01");
  const current = new Date(start);

  while (current < end) {
    const dayOfWeek = current.getDay();
    const weekNum = Math.floor(
      (current.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    // More activity on weekdays, increasing trend
    let base = dayOfWeek >= 1 && dayOfWeek <= 5 ? 0.6 : 0.3;
    base += weekNum * 0.03; // trend upward
    const rand = Math.random();
    let count = 0;
    if (rand < base) count = Math.ceil(Math.random() * 4);

    const level =
      count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 3 ? 3 : 4;

    days.push({
      date: current.toISOString().split("T")[0],
      count,
      level: level as ContributionDay["level"],
    });

    current.setDate(current.getDate() + 1);
  }
  return days;
}

export const contributions: ContributionDay[] = generateContributions();

export const streakInfo: StreakInfo = {
  current: 14,
  longest: 21,
  lastStudyDate: "2026-02-28",
};

// Helper to get topic by id
export function getTopicById(id: string): Topic | undefined {
  return topics.find((t) => t.id === id);
}

export function getCommitsByBranch(branchId: string): StudyCommit[] {
  const branch = branches.find((b) => b.id === branchId);
  if (!branch) return [];
  return branch.commits
    .map((cid) => commits.find((c) => c.id === cid)!)
    .filter(Boolean);
}
