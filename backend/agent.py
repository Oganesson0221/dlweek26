# import json
# from typing import List, Dict, Any
# import openai
# from config import Config

# class AIAgent:
#     """Simple agentic AI with tool usage"""
    
#     def __init__(self, name: str, system_prompt: str = None):
#         self.client = openai.OpenAI(
#             api_key=Config.OPENAI_API_KEY,
#             organization=Config.OPENAI_ORG_ID
#         )
#         self.name = name
#         self.system_prompt = system_prompt or f"You are {name}, a helpful AI assistant."
#         self.conversation_history = []
#         self.tools = {}
        
#     def add_tool(self, name: str, func, description: str):
#         """Add a tool/function that the agent can use"""
#         self.tools[name] = {
#             'function': func,
#             'description': description
#         }
    
#     def think(self, task: str) -> str:
#         """Process a task and return response"""
#         messages = [
#             {"role": "system", "content": self.system_prompt},
#             *self.conversation_history[-5:],  # Last 5 messages for context
#             {"role": "user", "content": task}
#         ]
        
#         response = self.client.chat.completions.create(
#             model=Config.DEFAULT_MODEL,
#             messages=messages,
#             max_tokens=Config.MAX_TOKENS,
#             temperature=Config.TEMPERATURE
#         )
        
#         result = response.choices[0].message.content
#         self.conversation_history.append({"role": "assistant", "content": result})
#         return result
    
#     def execute_with_tools(self, task: str) -> Dict[str, Any]:
#         """Execute task with potential tool usage"""
#         if not self.tools:
#             return {"response": self.think(task), "tools_used": []}
        
#         # Create tool descriptions for the model
#         tools_desc = "\n".join([f"- {name}: {info['description']}" 
#                                 for name, info in self.tools.items()])
        
#         enhanced_prompt = f"""Task: {task}

# Available tools:
# {tools_desc}

# If you need to use a tool, respond in this format:
# TOOL: tool_name
# INPUT: input_for_tool

# Otherwise, respond normally."""
        
#         response = self.think(enhanced_prompt)
        
#         # Check if tool was used
#         if response.startswith("TOOL:"):
#             lines = response.split('\n')
#             tool_name = lines[0].replace("TOOL:", "").strip()
#             tool_input = lines[1].replace("INPUT:", "").strip() if len(lines) > 1 else ""
            
#             if tool_name in self.tools:
#                 tool_result = self.tools[tool_name]['function'](tool_input)
#                 return {
#                     "response": f"Used tool {tool_name}: {tool_result}",
#                     "tools_used": [tool_name],
#                     "tool_result": tool_result
#                 }
        
#         return {"response": response, "tools_used": []}
    
#     def multi_step(self, goal: str, max_steps: int = 3) -> List[Dict]:
#         """Multi-step reasoning for complex tasks"""
#         steps = []
#         current_context = f"Goal: {goal}\n\n"
        
#         for step in range(max_steps):
#             step_prompt = f"{current_context}\nStep {step + 1}/{max_steps}: What should I do next?"
#             result = self.think(step_prompt)
            
#             steps.append({
#                 "step": step + 1,
#                 "action": result
#             })
            
#             current_context += f"\nStep {step + 1}: {result}\n"
            
#             if "COMPLETE" in result or step == max_steps - 1:
#                 break
        
#         return steps

# class MultiAgentSystem:
#     """Coordinate multiple agents"""
    
#     def __init__(self):
#         self.agents = {}
        
#     def add_agent(self, agent: AIAgent):
#         self.agents[agent.name] = agent
    
#     def delegate_task(self, task: str, primary_agent: str) -> Dict:
#         """Delegate task to primary agent with potential collaboration"""
#         if primary_agent not in self.agents:
#             return {"error": f"Agent {primary_agent} not found"}
        
#         agent = self.agents[primary_agent]
        
#         # Check if task might need other agents
#         if len(self.agents) > 1:
#             other_agents = [name for name in self.agents.keys() if name != primary_agent]
#             collaboration_prompt = f"""Task: {task}
            
# Other available agents: {', '.join(other_agents)}
# If you need help from another agent, specify which one and why."""
            
#             result = agent.think(collaboration_prompt)
#             return {
#                 "primary_agent": primary_agent,
#                 "response": result,
#                 "collaboration": "other agents mentioned" if any(a in result for a in other_agents) else "none"
#             }
        
#         return {
#             "primary_agent": primary_agent,
#             "response": agent.think(task)
#         }

from sqlmodel import Session
from services.planner import compute_study_plan
from services.analytics import improvement_trend

def handle_agent_message(session: Session, course_id: int | None, page: str, message: str) -> dict:
    text = message.lower().strip()

    if course_id is None:
        return {"reply": "Select a course first so I can guide you."}

    if ("two hours" in text) or ("2 hours" in text) or ("what should i study" in text):
        plan = compute_study_plan(session, course_id, 120)
        lines = [f"- {b['title']} ({b['minutes']} min): {b['why']}" for b in plan["plan"]]
        return {"reply": "Here’s a 2-hour study route:\n" + "\n".join(lines), "data": plan}

    if ("am i improving" in text) or ("improving" in text) or ("trend" in text):
        tr = improvement_trend(session, course_id)
        if tr.get("status") != "ok":
            return {"reply": "I don’t have enough recent quiz attempts to judge improvement yet.", "data": tr}
        delta = tr["delta"]
        if delta is None:
            return {"reply": f"Last 7d accuracy: {tr['acc_last_7d']}. I need more history to compare.", "data": tr}
        direction = "improving" if delta > 0 else ("declining" if delta < 0 else "flat")
        return {"reply": f"You are {direction}. Last 7d: {tr['acc_last_7d']:.0%}, prev 7d: {tr['acc_prev_7d']:.0%}.", "data": tr}

    return {"reply": "Try asking: 'I have 2 hours what should I study' or 'am I improving'."}