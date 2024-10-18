import { useGetManyServerlessFunctions } from '@/settings/serverless-functions/hooks/useGetManyServerlessFunctions';
import { TRIGGER_STEP_ID } from '@/workflow/constants/TriggerStepId';
import { WorkflowStep, WorkflowTrigger } from '@/workflow/types/Workflow';
import {
  WorkflowDiagram,
  WorkflowDiagramEdge,
  WorkflowDiagramNode,
  WorkflowDiagramNodeData,
} from '@/workflow/types/WorkflowDiagram';
import { splitWorkflowTriggerEventName } from '@/workflow/utils/splitWorkflowTriggerEventName';
import { MarkerType } from '@xyflow/react';
import { isDefined } from 'twenty-ui';
import { v4 } from 'uuid';
import { capitalize } from '~/utils/string/capitalize';

export const generateWorkflowDiagram = ({
  trigger,
  steps,
  serverlessFunctionsData,
}: {
  trigger: WorkflowTrigger | undefined;
  steps: Array<WorkflowStep>;
  serverlessFunctionsData: ReturnType<
    typeof useGetManyServerlessFunctions
  >['serverlessFunctions'];
}): WorkflowDiagram => {
  const nodes: Array<WorkflowDiagramNode> = [];
  const edges: Array<WorkflowDiagramEdge> = [];

  // Helper function to generate nodes and edges recursively
  const processNode = (
    step: WorkflowStep,
    parentNodeId: string,
    xPos: number,
    yPos: number,
  ) => {
    const nodeId = step.id;
    const nodeData: WorkflowDiagramNodeData = {
      nodeType: 'action',
      actionType: step.type,
      label: step.name,
    };

    if (step.type === 'CODE') {
      const serverlessFunctionData = serverlessFunctionsData.find(
        ({ id }) => id === step.settings.input.serverlessFunctionId,
      );
      if (!isDefined(serverlessFunctionData)) {
        throw new Error(
          'Could not find the definition of the serverless function',
        );
      }

      nodeData.label = serverlessFunctionData.name;
    }

    nodes.push({
      id: nodeId,
      data: nodeData,
      position: {
        x: xPos,
        y: yPos,
      },
    });

    // Create an edge from the parent node to this node
    edges.push({
      id: v4(),
      source: parentNodeId,
      target: nodeId,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });

    return nodeId;
  };

  // Start with the trigger node
  const triggerNodeId = TRIGGER_STEP_ID;

  if (isDefined(trigger)) {
    const triggerEvent = splitWorkflowTriggerEventName(
      trigger.settings.eventName,
    );

    nodes.push({
      id: triggerNodeId,
      data: {
        nodeType: 'trigger',
        label: `${capitalize(triggerEvent.objectType)} is ${capitalize(triggerEvent.event)}`,
      },
      position: {
        x: 0,
        y: 0,
      },
    });
  } else {
    nodes.push({
      id: triggerNodeId,
      type: 'empty-trigger',
      data: {} as any,
      position: {
        x: 0,
        y: 0,
      },
    });
  }

  let lastStepId = triggerNodeId;

  for (const step of steps) {
    lastStepId = processNode(step, lastStepId, 150, 100);
  }

  return {
    nodes,
    edges,
  };
};
