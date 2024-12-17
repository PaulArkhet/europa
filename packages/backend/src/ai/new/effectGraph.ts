import { Effect } from 'effect';
import { createGraph } from './graph';
import type { Message } from './messages';

type GraphState = {
  messages: Message;
};

/*
const workflow = new StateGraph(State)
  .addNode('reason', reasonNode)
  .addNode('act', actNode)
  .addNode('observer', observeNode)
  .addNode('reasonTools', reasonToolsNode)
  .addNode('actTools', actToolsNode)
  .addNode('observerTools', observerToolsNode)
  .addNode('markAsComplete', markAsCompleteNode)
  .addNode('resetTools', resetToolCountNode)
  .addEdge('resetTools', 'observer')
  .addEdge('reasonTools', 'reason')
  .addEdge('actTools', 'act')
  .addEdge('observerTools', 'observer')
  .addConditionalEdges('reason', shouldReasonContinue)
  .addConditionalEdges('act', shouldActContinue)
  .addConditionalEdges('observer', shouldObserverContinue)
  .addEdge(START, 'reason');
*/

createGraph<GraphState>()({
  reason: reasonNode,
});

function reasonNode(c: GraphState) {
  return Effect.succeed({ key: 'reason', state: c });
}
