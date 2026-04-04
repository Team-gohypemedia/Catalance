import React, { useEffect } from 'react';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import dagre from 'dagre';

const nodeWidth = 280;
const nodeHeight = 144;

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

const getQuestionTypeLabel = (type = 'input') => {
    if (type === 'single_option') return 'Single Select';
    if (type === 'multi_option') return 'Multi Select';
    return 'Text Input';
};

const getQuestionTypeColors = (type = 'input') => {
    if (type === 'single_option') {
        return {
            badgeText: '#facc15',
            badgeBackground: 'rgba(250, 204, 21, 0.12)',
            badgeBorder: '1px solid rgba(250, 204, 21, 0.2)',
            accent: '#facc15',
        };
    }

    if (type === 'multi_option') {
        return {
            badgeText: '#34d399',
            badgeBackground: 'rgba(52, 211, 153, 0.12)',
            badgeBorder: '1px solid rgba(52, 211, 153, 0.2)',
            accent: '#34d399',
        };
    }

    return {
        badgeText: '#e5e7eb',
        badgeBackground: 'rgba(255, 255, 255, 0.06)',
        badgeBorder: '1px solid rgba(255, 255, 255, 0.08)',
        accent: '#94a3b8',
    };
};

const nodeHelper = (question, index) => {
    const typeLabel = getQuestionTypeLabel(question.type);
    const typeColors = getQuestionTypeColors(question.type);
    const logicRuleCount = Array.isArray(question.logic)
        ? question.logic.filter((rule) => rule.nextQuestionSlug).length
        : 0;

    return {
        id: question.id,
        position: { x: 0, y: 0 },
        data: {
            label: (
                <div className="flex h-full flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
                        <div className="min-w-0 space-y-2">
                            <span className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                <span className="truncate">{question.id}</span>
                            </span>
                            <p className="line-clamp-3 text-[13px] font-medium leading-5 text-white">
                                {question.question}
                            </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-200">
                            {index + 1}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <span
                                className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                                style={{
                                    color: typeColors.badgeText,
                                    background: typeColors.badgeBackground,
                                    border: typeColors.badgeBorder,
                                }}
                            >
                                {typeLabel}
                            </span>
                            {question.saveResponse ? (
                                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    AI Context
                                </span>
                            ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
                            <span>{logicRuleCount > 0 ? `${logicRuleCount} branch rules` : 'Sequential flow'}</span>
                            <span>{question.required ? 'Required' : 'Optional'}</span>
                        </div>
                    </div>
                </div>
            ),
            question,
        },
        type: 'default',
        style: {
            background: 'linear-gradient(180deg, rgba(31,31,31,0.98), rgba(12,12,12,0.98))',
            border: `1px solid ${typeColors.accent === '#94a3b8' ? 'rgba(255,255,255,0.08)' : `${typeColors.accent}30`}`,
            borderRadius: '18px',
            padding: '16px',
            width: nodeWidth,
            minHeight: nodeHeight,
            boxShadow: '0 14px 34px rgba(0, 0, 0, 0.28)',
            textAlign: 'left',
        },
    };
};

const ServiceQuestionFlow = ({ questions, onEditQuestion }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (!questions || questions.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const initialNodes = questions.map((question, index) => nodeHelper(question, index));
        const initialEdges = [];

        questions.forEach((question, index) => {
            let hasLogicBranch = false;

            if (Array.isArray(question.logic) && question.logic.length > 0) {
                question.logic.forEach((rule, ruleIndex) => {
                    if (rule.nextQuestionSlug) {
                        hasLogicBranch = true;
                        initialEdges.push({
                            id: `e-${question.id}-logic-${ruleIndex}`,
                            source: question.id,
                            target: rule.nextQuestionSlug,
                            label: `${rule.condition === 'equals' ? 'If' : rule.condition} ${rule.value || 'match'}`,
                            type: 'smoothstep',
                            animated: false,
                            style: { stroke: '#facc15', strokeWidth: 2.25 },
                            labelStyle: { fill: '#facc15', fontWeight: 700, fontSize: 10 },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: '#facc15',
                            },
                        });
                    }
                });
            }

            if (index < questions.length - 1) {
                initialEdges.push({
                    id: `e-${question.id}-default`,
                    source: question.id,
                    target: questions[index + 1].id,
                    label: hasLogicBranch ? 'Else' : 'Next',
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: 'rgba(148, 163, 184, 0.85)', strokeDasharray: '6,6', strokeWidth: 1.5 },
                    labelStyle: { fill: '#94a3b8', fontSize: 10 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'rgba(148, 163, 184, 0.85)',
                    },
                });
            }
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [questions, setEdges, setNodes]);

    const onNodeClick = (_event, node) => {
        if (onEditQuestion && node.data.question) {
            onEditQuestion(node.data.question);
        }
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0b0b]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                minZoom={0.3}
                maxZoom={1.5}
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
            >
                <Controls />
                <Background color="rgba(255,255,255,0.08)" gap={22} size={1} />
            </ReactFlow>
        </div>
    );
};

export default ServiceQuestionFlow;
