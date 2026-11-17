"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Database,
  Layers3,
  Network,
  Server,
  Users,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Types retain the exact property names from the supplied mock/API structure.
// -----------------------------------------------------------------------------

type PartitionRow = {
  partition: number;
  current_offset: number;
  log_end_offset: number;
  lag: number;
};

type TopicStatus = {
  id: string;
  name: string;
  table: PartitionRow[];
};

type ConsumerGroup = {
  group_id: string;
  state: string;
  status: {
    total_consumers: number;
    working_consumers: number;
    idle_consumers: number;
  };
  topicStatus: TopicStatus;
};

type KafkaTopic = {
  id: string;
  name: string;
  number: string;
  groups: ConsumerGroup[];
};

type KafkaBroker = {
  id: string;
  name: string;
  status: string;
  topics: KafkaTopic[];
};

type KafkaCluster = {
  name: string;
  status: string;
  brokers: KafkaBroker[];
};

type CommonNodeData = {
  title: string;
  subtitle?: string;
  status?: string;
};

type BrokerNodeData = CommonNodeData & { expanded: boolean; onToggle: (expanded: boolean) => void };
type TopicNodeData = {
  topic: KafkaTopic;
  expanded: boolean;
  onToggle: (topicId: string, open: boolean) => void;
};

// -----------------------------------------------------------------------------
// Mock data copied from kafka data.txt without changing its values or shape.
// -----------------------------------------------------------------------------

const initialKafkaData: KafkaCluster = {
  name: "kafka-cluster-1",
  status: "Healthy",
  brokers: [
    {
      id: "broker-1",
      name: "Broker-1",
      status: "Online",
      topics: [
        {
          id: "tp-meter-command",
          name: "tp-meter-command",
          number: "6",
          groups: [
            {
              group_id: "gp-dlms-worker",
              state: "STABLE",
              status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
              topicStatus: {
                id: "tp-meter-command",
                name: "tp-meter-command",
                table: [
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                ],
              },
            },
          ],
        },
        {
          id: "tp-request-queue",
          name: "tp-request-queue",
          number: "1",
          groups: [
            {
              group_id: "gp-dlms-worker",
              state: "STABLE",
              status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
              topicStatus: {
                id: "tp-meter-command",
                name: "tp-meter-command",
                table: [
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                ],
              },
            },
          ],
        },
        {
          id: "tp-meter-response",
          name: "tp-meter-response",
          number: "6",
          groups: [
            {
              group_id: "gp-db-writer",
              state: "STABLE",
              status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
              topicStatus: {
                id: "tp-meter-response",
                name: "tp-meter-response",
                table: [
                  { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 4, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 5, current_offset: 239, log_end_offset: 239, lag: 0 },
                  { partition: 0, current_offset: 213, log_end_offset: 223, lag: 0 },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};

function ClusterNode({ data }: NodeProps<Node<CommonNodeData>>) {
  return (
    <div className="w-[390px] rounded-2xl border border-emerald-500 bg-white p-5 shadow-lg">
      <Handle id="cluster-out" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-600" />
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700"><Network className="h-8 w-8" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-slate-900">{data.title}</p>
          <Badge className="mt-2 border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />{data.status}</Badge>
        </div>
      </div>
    </div>
  );
}

function BrokerNode({ data }: NodeProps<Node<BrokerNodeData>>) {
  return (
    <div className="w-[390px] rounded-2xl border border-slate-300 bg-white p-5 shadow-md">
      <Handle id="broker-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <Handle id="broker-out" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 p-4 text-blue-700"><Server className="h-8 w-8" /></div>
        <div className="min-w-0 flex-1"><p className="text-xl font-bold text-slate-900">{data.title}</p><p className="mt-1 text-sm text-slate-500">{data.subtitle}</p></div>
        <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CircleDot className="mr-1 h-3 w-3" />{data.status}</Badge>
        <Button type="button" variant="outline" size="icon" aria-label={data.expanded ? "Collapse broker topics" : "Expand broker topics"} onClick={(event) => { event.stopPropagation(); data.onToggle(!data.expanded); }}>
          <ChevronDown className={`h-4 w-4 transition-transform ${data.expanded ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <p className="mt-3 text-xs text-slate-500">{data.expanded ? "Topics visible · click to collapse" : "Topics hidden · click to expand"}</p>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "amber" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p></div>;
}

function TopicNode({ id, data }: NodeProps<Node<TopicNodeData>>) {
  const { topic, expanded, onToggle } = data;
  const updateNodeInternals = useUpdateNodeInternals();

  // React Flow caches node dimensions. Re-measure after opening/closing so the
  // node body, hit area and connected edge endpoints all use the new height.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, expanded, topic.groups, updateNodeInternals]);

  return (
    <div onClick={(event) => event.stopPropagation()} className={`w-[560px] rounded-2xl border bg-white p-5 shadow-md transition-shadow ${expanded ? "border-violet-300 shadow-lg" : "border-slate-300"}`}>
      <Handle id="topic-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <Collapsible open={expanded} onOpenChange={(open) => onToggle(topic.id, open)}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Database className="h-7 w-7" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900">{topic.name}</p>
            <Badge variant="secondary" className="mt-1 bg-violet-50 text-violet-800"><Layers3 className="mr-1 h-3 w-3" />{topic.number} Partitions</Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label={expanded ? "Collapse topic" : "Expand topic"}>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t pt-3 text-sm text-slate-600">
          <Users className="h-4 w-4" />
          <span>{topic.groups.length} consumer {topic.groups.length === 1 ? "group" : "groups"}</span>
          <span className="text-slate-400">·</span>
          <span>{expanded ? "Click to collapse" : "Click to expand"}</span>
        </div>
        <CollapsibleContent forceMount className="data-[state=closed]:hidden">
          <div className="space-y-3 pt-4">
            {topic.groups.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">No consumer groups found.</div>
            ) : topic.groups.map((group, index) => (
              <section key={`${group.group_id}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><Users className="h-4 w-4 text-violet-700" />{group.group_id}</div>
                  <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{group.state}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Metric label="Total consumers" value={group.status.total_consumers} />
                  <Metric label="Working" value={group.status.working_consumers} tone="green" />
                  <Metric label="Idle" value={group.status.idle_consumers} tone="amber" />
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border bg-white">
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic status</p><p className="truncate text-sm font-semibold text-slate-800">{group.topicStatus.name}</p></div>
                    <Badge variant="outline" className="shrink-0">{group.topicStatus.table.length} rows</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead className="whitespace-nowrap">Partition</TableHead><TableHead className="whitespace-nowrap text-right">Current offset</TableHead><TableHead className="whitespace-nowrap text-right">Log end offset</TableHead><TableHead className="whitespace-nowrap text-right">Lag</TableHead></TableRow></TableHeader>
                      <TableBody>{group.topicStatus.table.map((row, rowIndex) => <TableRow key={`${row.partition}-${rowIndex}`}><TableCell>{row.partition}</TableCell><TableCell className="text-right tabular-nums">{row.current_offset}</TableCell><TableCell className="text-right tabular-nums">{row.log_end_offset}</TableCell><TableCell className="text-right tabular-nums"><span className={row.lag > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}>{row.lag}</span></TableCell></TableRow>)}</TableBody>
                    </Table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

const nodeTypes = { cluster: ClusterNode, broker: BrokerNode, topic: TopicNode };
const TOPIC_WIDTH = 560;
const TOPIC_GAP = 44;

function makeLayout(cluster: KafkaCluster, expandedTopics: string[], brokerExpanded: boolean, onToggle: (id: string, open: boolean) => void, onToggleBroker: (open: boolean) => void) {
  const broker = cluster.brokers[0];
  const topics = brokerExpanded ? (broker?.topics ?? []) : [];
  const totalWidth = Math.max(TOPIC_WIDTH, topics.length * TOPIC_WIDTH + Math.max(0, topics.length - 1) * TOPIC_GAP);
  const startX = -totalWidth / 2;
  const nodes: Node[] = [
    { id: "cluster", type: "cluster", position: { x: -195, y: 30 }, data: { title: cluster.name, status: cluster.status }, draggable: false },
    ...(broker ? [{ id: broker.id, type: "broker", position: { x: -195, y: 245 }, data: { title: broker.name, subtitle: broker.id, status: broker.status, expanded: brokerExpanded, onToggle: onToggleBroker }, draggable: false } as Node] : []),
    ...topics.map((topic, index) => ({ id: topic.id, type: "topic", position: { x: startX + index * (TOPIC_WIDTH + TOPIC_GAP), y: 455 }, data: { topic, expanded: expandedTopics.includes(topic.id), onToggle }, draggable: false } as Node)),
  ];
  const edges: Edge[] = [
    ...(broker ? [{ id: "cluster-broker", source: "cluster", sourceHandle: "cluster-out", target: broker.id, targetHandle: "broker-in", type: "smoothstep", style: { stroke: "#64748b", strokeWidth: 2 } } as Edge] : []),
    ...topics.map((topic) => ({ id: `broker-${topic.id}`, source: broker?.id ?? "", sourceHandle: "broker-out", target: topic.id, targetHandle: "topic-in", type: "smoothstep" as const, style: { stroke: "#64748b", strokeWidth: 2 } })),
  ];
  return { nodes, edges };
}

function KafkaHierarchyCanvas() {
  const [cluster] = useState<KafkaCluster>(initialKafkaData);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [brokerExpanded, setBrokerExpanded] = useState(true);
  const { fitView } = useReactFlow();

  function toggleTopic(topicId: string, open: boolean) {
    setExpandedTopics((current) => open
      ? (current.includes(topicId) ? current : [...current, topicId])
      : current.filter((id) => id !== topicId));
  }

  function toggleBroker(open: boolean) {
    setBrokerExpanded(open);
    if (!open) setExpandedTopics([]);
  }

  const layout = makeLayout(cluster, expandedTopics, brokerExpanded, toggleTopic, toggleBroker);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>(layout.nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>(layout.edges);

  // Rebuild both nodes and edges together. React Flow then re-measures expanded
  // topic nodes and reconnects the edges to their actual handle positions.
  useEffect(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
    const frame = requestAnimationFrame(() => fitView({ padding: 0.16, duration: 250, minZoom: 0.25, maxZoom: 1 }));
    return () => cancelAnimationFrame(frame);
  }, [cluster, expandedTopics, brokerExpanded]);

  return (
    <div className="flex h-[850px] min-h-[650px] w-full flex-col overflow-hidden rounded-2xl border bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-900"><Network className="h-7 w-7" /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-950">Kafka Hierarchy</h1><p className="text-sm text-slate-500">Cluster → Broker → Topics → Consumer groups and partition status</p></div></div>
        <Badge className="border-0 bg-emerald-100 px-3 py-1.5 text-emerald-800 hover:bg-emerald-100"><Activity className="mr-1.5 h-3.5 w-3.5" />Cluster: {cluster.status}</Badge>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlow nodes={flowNodes} edges={flowEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.2} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false}
          elementsSelectable={false} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: "smoothstep", interactionWidth: 20 }}>
          <Background color="#cbd5e1" gap={22} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function KafkaHierarchy() {
  return <ReactFlowProvider><KafkaHierarchyCanvas /></ReactFlowProvider>;
}
