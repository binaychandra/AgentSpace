import operator
from typing import TypedDict, Annotated, List, Union
from pprint import pprint

from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt import tools_condition
from tools import add, subtract, multiply
from langgraph.checkpoint.memory import MemorySaver

class SimpleAgent:
    def __init__(self, mode: str, llm_model: str, tools: List[callable]):
        if mode=='local':
            self.llm = ChatOpenAI(
                base_url="http://localhost:11434/v1",
                model='gemma3:1b',
                api_key='not_required',
                temperature=0,
            )
        else:
            self.llm = ChatOpenAI(
                model=llm_model,
                temperature=0
            )
        self.tools = tools
        self.tool_names = {tool.name for tool in self.tools}
        self.graph = self._build_graph()
    
    def _should_continue(self, state: MessagesState):
        """
        Determine whether to continue or end.
        """
        last_message = state["messages"][-1]
        if "AgentFinish" in last_message.content:
            return "end"
        else:
            return "continue"
    
    def _llm_response(self, state: MessagesState) -> MessagesState:
        response = self.llm.invoke(state["messages"])
        print(f"\nAI: {response.content}")
        return state
        
    def _build_graph(self):
        """
        Builds and compiles the LangGraph graph.
        """
        memory = MemorySaver()
        workflow = StateGraph(MessagesState)
        workflow.add_node("assistant", self._llm_response)
        workflow.add_node("tools", ToolNode([add, subtract, multiply]))

        workflow.add_edge(START, "assistant")
        workflow.add_conditional_edges("assistant", tools_condition)
        workflow.add_edge("tools", END)

        workflow.add_edge("tools", "assistant")

        return workflow.compile(checkpointer=memory)


# import asyncio

# async def main():
#     objSimpleAgent = SimpleAgent(mode='local', llm_model=None, tools=[])
#     config = {"configurable": {"thread_id": "5"}}
#     input_message = HumanMessage(content="Tell me about the 49ers NFL team")
#     async for event in objSimpleAgent.graph.astream_events({"messages": [input_message]}, config, version="v2"):
#         # Get chat model tokens from a particular node 
#         if event["event"] == "on_chat_model_stream" and event['metadata'].get('langgraph_node','') == "assistant":
#             data = event["data"]
#             print(data["chunk"].content, end="|")

# if __name__ == '__main__':
#     asyncio.run(main())