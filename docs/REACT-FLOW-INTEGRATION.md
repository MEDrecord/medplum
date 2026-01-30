# React Flow Integration

> **Version:** 1.0.0  
> **Last Updated:** January 2026  
> **Status:** Approved

## Overview

React Flow is used in MEDrecord for visualizing and editing agent workflows. This document describes the integration patterns, custom node types, and best practices.

**Library:** [@xyflow/react](https://reactflow.dev/) (Open Source)

---

## Use Cases

### 1. Workflow Visualization (Read-Only)

Display agent workflows to users for understanding and monitoring:

- Show the flow structure
- Highlight current execution state
- Display execution history

### 2. Workflow Editor (Admin)

Allow administrators to create and modify agent workflows:

- Drag-and-drop node creation
- Edge connection management
- Property configuration panels

### 3. Execution Monitoring

Real-time visualization of agent execution:

- Highlight active node
- Show data flow between nodes
- Display errors and logs

---

## Node Types

### Base Node Structure

All custom nodes follow a consistent structure:

```typescript
// components/flow/nodes/BaseNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface BaseNodeData {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export function BaseNode({ 
  data, 
  selected,
  children 
}: NodeProps<BaseNodeData> & { children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        'min-w-[200px]',
        selected && 'ring-2 ring-primary',
        data.status === 'running' && 'border-blue-500 animate-pulse',
        data.status === 'success' && 'border-green-500',
        data.status === 'error' && 'border-destructive'
      )}
    >
      <div className="font-medium">{data.label}</div>
      {data.description && (
        <div className="text-sm text-muted-foreground mt-1">
          {data.description}
        </div>
      )}
      {children}
    </div>
  );
}
```

### Trigger Node

Entry point for agent workflows:

```typescript
// components/flow/nodes/TriggerNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, Clock, Webhook, FileInput } from 'lucide-react';

interface TriggerNodeData {
  label: string;
  triggerType: 'manual' | 'schedule' | 'fhir-subscription' | 'webhook';
  config: Record<string, unknown>;
  status?: 'idle' | 'running' | 'success' | 'error';
}

const triggerIcons = {
  manual: Play,
  schedule: Clock,
  'fhir-subscription': FileInput,
  webhook: Webhook,
};

export function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const Icon = triggerIcons[data.triggerType];

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-green-500 bg-green-50 p-4',
        'min-w-[200px]',
        selected && 'ring-2 ring-primary'
      )}
    >
      <Handle type="source" position={Position.Bottom} />
      
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-green-600" />
        <span className="font-medium">{data.label}</span>
      </div>
      
      <div className="text-sm text-muted-foreground mt-1">
        {data.triggerType === 'schedule' && data.config.cron}
        {data.triggerType === 'fhir-subscription' && 
          `${data.config.resourceType} ${data.config.event}`}
      </div>
    </div>
  );
}
```

### Action Node

Executes a tool or operation:

```typescript
// components/flow/nodes/ActionNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cog, MessageSquare, Database, Mail } from 'lucide-react';

interface ActionNodeData {
  label: string;
  toolId: string;
  toolCategory: 'fhir' | 'communication' | 'ai' | 'internal';
  input: Record<string, string>;
  outputVariable: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

const categoryIcons = {
  fhir: Database,
  communication: MessageSquare,
  ai: Cog,
  internal: Cog,
};

const categoryColors = {
  fhir: 'border-blue-500 bg-blue-50',
  communication: 'border-purple-500 bg-purple-50',
  ai: 'border-orange-500 bg-orange-50',
  internal: 'border-gray-500 bg-gray-50',
};

export function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const Icon = categoryIcons[data.toolCategory];

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 min-w-[200px]',
        categoryColors[data.toolCategory],
        selected && 'ring-2 ring-primary',
        data.status === 'running' && 'animate-pulse'
      )}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-medium">{data.label}</span>
      </div>
      
      <div className="text-xs text-muted-foreground mt-1 font-mono">
        {data.toolId}
      </div>
      
      {data.outputVariable && (
        <div className="text-xs mt-2 bg-background/50 rounded px-2 py-1">
          Output: <code>{data.outputVariable}</code>
        </div>
      )}
    </div>
  );
}
```

### Condition Node

Branching logic based on expressions:

```typescript
// components/flow/nodes/ConditionNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  expression: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  evaluatedTo?: boolean;
}

export function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-amber-500 bg-amber-50 p-4',
        'min-w-[200px]',
        selected && 'ring-2 ring-primary'
      )}
    >
      <Handle type="target" position={Position.Top} />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true"
        style={{ left: '25%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false"
        style={{ left: '75%' }}
      />
      
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-amber-600" />
        <span className="font-medium">{data.label}</span>
      </div>
      
      <div className="text-xs text-muted-foreground mt-1 font-mono bg-background/50 rounded px-2 py-1">
        {data.expression}
      </div>
      
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-green-600">Yes</span>
        <span className="text-red-600">No</span>
      </div>
    </div>
  );
}
```

### Outcome Node

Terminal node representing workflow completion:

```typescript
// components/flow/nodes/OutcomeNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OutcomeNodeData {
  label: string;
  outcomeStatus: 'success' | 'failure' | 'partial';
  message: string;
  status?: 'idle' | 'running' | 'success' | 'error';
}

const outcomeConfig = {
  success: {
    icon: CheckCircle,
    className: 'border-green-500 bg-green-50',
    iconClass: 'text-green-600',
  },
  failure: {
    icon: XCircle,
    className: 'border-red-500 bg-red-50',
    iconClass: 'text-red-600',
  },
  partial: {
    icon: AlertCircle,
    className: 'border-amber-500 bg-amber-50',
    iconClass: 'text-amber-600',
  },
};

export function OutcomeNode({ data, selected }: NodeProps<OutcomeNodeData>) {
  const config = outcomeConfig[data.outcomeStatus];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 min-w-[200px]',
        config.className,
        selected && 'ring-2 ring-primary'
      )}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', config.iconClass)} />
        <span className="font-medium">{data.label}</span>
      </div>
      
      <div className="text-sm text-muted-foreground mt-1">
        {data.message}
      </div>
    </div>
  );
}
```

---

## Edge Types

### Default Edge

Standard connection between nodes:

```typescript
// components/flow/edges/DefaultEdge.tsx
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export function DefaultEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={style}
    />
  );
}
```

### Conditional Edge

Edge with label for condition branches:

```typescript
// components/flow/edges/ConditionalEdge.tsx
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  type EdgeProps 
} from '@xyflow/react';

interface ConditionalEdgeData {
  label: string;
  condition: 'true' | 'false';
}

export function ConditionalEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<ConditionalEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          stroke: data?.condition === 'true' ? '#22c55e' : '#ef4444',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          className="px-2 py-1 rounded bg-background border text-xs"
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

---

## Agent Flow Canvas

Main component that renders the workflow:

```typescript
// components/flow/AgentFlowCanvas.tsx
'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutcomeNode } from './nodes/OutcomeNode';
import { ConditionalEdge } from './edges/ConditionalEdge';
import type { AgentWorkflow } from '@/lib/agents/types';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  outcome: OutcomeNode,
};

const edgeTypes = {
  conditional: ConditionalEdge,
};

interface AgentFlowCanvasProps {
  workflow: AgentWorkflow;
  executionState?: {
    currentNodeId?: string;
    completedNodeIds: string[];
    variables: Record<string, unknown>;
  };
  editable?: boolean;
  onWorkflowChange?: (workflow: AgentWorkflow) => void;
}

export function AgentFlowCanvas({
  workflow,
  executionState,
  editable = false,
  onWorkflowChange,
}: AgentFlowCanvasProps) {
  // Convert workflow to React Flow format
  const initialNodes = useMemo(() => 
    workflowToNodes(workflow, executionState),
    [workflow, executionState]
  );
  
  const initialEdges = useMemo(() => 
    workflowToEdges(workflow),
    [workflow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!editable) return;
      setEdges((eds) => addEdge(connection, eds));
    },
    [editable, setEdges]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={editable ? onNodesChange : undefined}
        onEdgesChange={editable ? onEdgesChange : undefined}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}

// Helper functions
function workflowToNodes(
  workflow: AgentWorkflow,
  executionState?: AgentFlowCanvasProps['executionState']
): Node[] {
  return workflow.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: node.position || { x: 250, y: index * 150 },
    data: {
      ...node.data,
      status: getNodeStatus(node.id, executionState),
    },
  }));
}

function workflowToEdges(workflow: AgentWorkflow): Edge[] {
  return workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    type: edge.condition ? 'conditional' : 'default',
    data: edge.condition ? {
      label: edge.label,
      condition: edge.condition,
    } : undefined,
  }));
}

function getNodeStatus(
  nodeId: string,
  executionState?: AgentFlowCanvasProps['executionState']
): 'idle' | 'running' | 'success' | 'error' {
  if (!executionState) return 'idle';
  if (executionState.currentNodeId === nodeId) return 'running';
  if (executionState.completedNodeIds.includes(nodeId)) return 'success';
  return 'idle';
}
```

---

## Execution Monitoring

Real-time updates during agent execution:

```typescript
// hooks/useAgentExecution.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AgentExecution } from '@/lib/agents/types';

export function useAgentExecution(executionId: string | null) {
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!executionId) return;

    setIsLoading(true);
    
    // Poll for updates
    const interval = setInterval(async () => {
      const response = await fetch(`/api/agents/status/${executionId}`);
      const data = await response.json();
      
      setExecution(data);
      setIsLoading(false);
      
      // Stop polling when complete
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [executionId]);

  return { execution, isLoading };
}
```

---

## Page Integration

Example agent detail page with workflow visualization:

```typescript
// app/(dashboard)/agents/[agentId]/page.tsx
import { gateway } from '@/lib/gateway/client';
import { AgentFlowCanvas } from '@/components/flow/AgentFlowCanvas';
import { AgentHeader } from '@/components/agents/AgentHeader';
import { AgentExecuteButton } from '@/components/agents/AgentExecuteButton';

interface AgentPageProps {
  params: Promise<{ agentId: string }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId } = await params;
  const agent = await gateway.fetch(`/api/agents/${agentId}`);

  return (
    <div className="flex flex-col h-full">
      <AgentHeader agent={agent.data} />
      
      <div className="flex-1 min-h-0">
        <AgentFlowCanvas 
          workflow={agent.data.workflow}
          editable={false}
        />
      </div>
      
      <div className="p-4 border-t">
        <AgentExecuteButton agentId={agentId} />
      </div>
    </div>
  );
}
```

---

## Styling Guidelines

### Required: Use Design System Only

All React Flow custom nodes must use:

- shadcn/ui components where applicable
- Tailwind classes from the design system
- Design tokens (bg-card, text-muted-foreground, etc.)

### Forbidden

```typescript
// FORBIDDEN: Inline styles
<div style={{ backgroundColor: 'blue' }}>  // NO

// FORBIDDEN: Hardcoded colors
<div className="bg-[#3b82f6]">  // NO

// CORRECT: Design tokens
<div className="bg-primary">  // YES
<div className="border-blue-500 bg-blue-50">  // YES (semantic)
```

---

## References

- [React Flow Documentation](https://reactflow.dev/docs)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [AGENTS.md](./AGENTS.md) - Agent framework specification
