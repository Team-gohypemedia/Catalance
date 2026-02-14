import React, { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import dagre from 'dagre';

const nodeWidth = 250;
const nodeHeight = 100;

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: 'TB' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Dagre returns center coordinates, React Flow needs top-left
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const nodeHelper = (question) => {
    return {
        id: question.id,
        position: { x: 0, y: 0 }, // Initial position, will be overridden by dagre
        data: {
            label: (
                <div className="flex flex-col h-full justify-between">
                    <div className="pb-2 border-b border-gray-100 mb-2">
                        <span className="font-mono text-[10px] uppercase text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded">
                            {question.id}
                        </span>
                    </div>
                    <div className="text-sm font-medium leading-tight line-clamp-3">
                        {question.question}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-50 flex gap-1 justify-end">
                        {question.type === 'input' && <div className="text-[10px] text-gray-400">Text Input</div>}
                        {question.type !== 'input' && <div className="text-[10px] text-blue-500 font-medium">Selection</div>}
                    </div>
                </div>
            ),
            question: question
        },
        type: 'default',
        style: {
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            width: nodeWidth,
            minHeight: 80,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            textAlign: 'left'
        },
    };
};

const ServiceQuestionFlow = ({ questions, onEditQuestion }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (!questions || questions.length === 0) return;

        // 1. Create Nodes
        const initialNodes = questions.map((q) => nodeHelper(q));

        // 2. Create Edges
        const initialEdges = [];
        questions.forEach((q, idx) => {
            let hasLogicBranch = false;

            // Interface Logic Branches
            if (q.logic && q.logic.length > 0) {
                q.logic.forEach((rule, rIdx) => {
                    if (rule.nextQuestionSlug) {
                        hasLogicBranch = true;
                        initialEdges.push({
                            id: `e-${q.id}-logic-${rIdx}`,
                            source: q.id,
                            target: rule.nextQuestionSlug,
                            label: `${rule.condition === 'equals' ? 'Is' : rule.condition} "${rule.value}"`,
                            type: 'smoothstep',
                            animated: false,
                            style: { stroke: '#3b82f6', strokeWidth: 2 },
                            labelStyle: { fill: '#3b82f6', fontWeight: 700, fontSize: 10 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#3b82f6',
                            },
                        });
                    }
                });
            }

            // Default Flow (Next Step) - Only add if NO logic or logically allows continuation
            // NOTE: Usually if there is logic, default flow acts as "Else". 
            // For now, let's assume if there are logic rules covering *some* cases, 
            // the implicit "next" still exists for other cases unless it's a terminal node.
            // But to keep graph clean, maybe we only show "Next" if it falls through?
            // Let's add "Next" for sequential continuity unless it's the last one.
            if (idx < questions.length - 1) {
                initialEdges.push({
                    id: `e-${q.id}-default`,
                    source: q.id,
                    target: questions[idx + 1].id,
                    label: hasLogicBranch ? 'Else' : 'Next',
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#cbd5e1', strokeDasharray: '5,5' },
                    labelStyle: { fill: '#94a3b8', fontSize: 10 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#cbd5e1',
                    },
                });
            }
        });

        // 3. Apply Layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [questions, setNodes, setEdges]);

    const onNodeClick = (event, node) => {
        if (onEditQuestion && node.data.question) {
            onEditQuestion(node.data.question);
        }
    };

    return (
        <div style={{ width: '100%', height: '600px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-right"
            >
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default ServiceQuestionFlow;
