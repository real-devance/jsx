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

// Data types and property names intentionally match the supplied JSON.
type PartitionRow = {
  partition: number;
  current_offset: number;
  log_end_offset: number;
  lag: number;
};
type TopicStatus = { id: string; name: string; table: PartitionRow[] };
type ConsumerGroup = {
  group_id: string;
  state: string;
  status: { total_consumers: number; working_consumers: number; idle_consumers: number };
  topicStatus: TopicStatus;
};
type KafkaTopic = { id: string; name: string; number: string; groups: ConsumerGroup[] };
type KafkaBroker = { id: string; name: string; status: string; topics: KafkaTopic[] };
type KafkaCluster = { name: string; status: string; brokers: KafkaBroker[] };

type ClusterNodeData = { title: string; status: string };
type BrokerNodeData = {
  title: string;
  subtitle: string;
  status: string;
  expanded: boolean;
  onToggle: (open: boolean) => void;
};
type TopicNodeData = {
  topic: KafkaTopic;
  expanded: boolean;
  expandedGroups: string[];
  onToggleTopic: (topicId: string, open: boolean) => void;
  onToggleGroup: (topicId: string, groupKey: string, open: boolean) => void;
};

// Original mock data copied from kafka data.txt; values and structure unchanged.
const initialKafkaData: KafkaCluster = {
  name: "kafka-cluster-1",
  status: "Healthy",
  brokers: [{
    id: "broker-1",
    name: "Broker-1",
    status: "Online",
    topics: [
      {
        id: "tp-meter-command", name: "tp-meter-command", number: "6",
        groups: [{
          group_id: "gp-dlms-worker", state: "STABLE",
          status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
          topicStatus: { id: "tp-meter-command", name: "tp-meter-command", table: [
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
          ] },
        }],
      },
      {
        id: "tp-request-queue", name: "tp-request-queue", number: "1",
        groups: [{
          group_id: "gp-dlms-worker", state: "STABLE",
          status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
          topicStatus: { id: "tp-meter-command", name: "tp-meter-command", table: [
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
          ] },
        }],
      },
      {
        id: "tp-meter-response", name: "tp-meter-response", number: "6",
        groups: [{
          group_id: "gp-db-writer", state: "STABLE",
          status: { total_consumers: 2, working_consumers: 2, idle_consumers: 0 },
          topicStatus: { id: "tp-meter-response", name: "tp-meter-response", table: [
            { partition: 3, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 4, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 5, current_offset: 239, log_end_offset: 239, lag: 0 },
            { partition: 0, current_offset: 213, log_end_offset: 223, lag: 0 },
          ] },
        }],
      },
    ],
  }],
};

function ClusterNode({ data }: NodeProps<Node<ClusterNodeData>>) {
  return <div className="w-[390px] rounded-2xl border border-emerald-500 bg-white p-5 shadow-lg">
    <Handle id="cluster-out" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-emerald-600" />
    <div className="flex items-center gap-4">
      <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700"><Network className="h-8 w-8" /></div>
      <div className="min-w-0 flex-1"><p className="text-xl font-bold text-slate-900">{data.title}</p><Badge className="mt-2 border-0 bg-emerald-100 text-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />{data.status}</Badge></div>
    </div>
  </div>;
}

function BrokerNode({ data }: NodeProps<Node<BrokerNodeData>>) {
  return <div className="w-[390px] rounded-2xl border border-slate-300 bg-white p-5 shadow-md">
    <Handle id="broker-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
    <Handle id="broker-out" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
    <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-4 text-blue-700"><Server className="h-8 w-8" /></div><div className="min-w-0 flex-1"><p className="text-xl font-bold text-slate-900">{data.title}</p><p className="text-sm text-slate-500">{data.subtitle}</p></div><Badge className="border-0 bg-emerald-100 text-emerald-800"><CircleDot className="mr-1 h-3 w-3" />{data.status}</Badge>
      <Button type="button" variant="outline" size="icon" onClick={() => data.onToggle(!data.expanded)} aria-label={data.expanded ? "Collapse broker" : "Expand broker"}><ChevronDown className={`h-4 w-4 transition-transform ${data.expanded ? "rotate-180" : ""}`} /></Button>
    </div>
    <p className="mt-3 text-xs text-slate-500">{data.expanded ? "Topics are visible" : "Topics are hidden"}</p>
  </div>;
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "amber" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p></div>;
}

function ConsumerGroupCard({ group, groupKey, open, onOpenChange }: {
  group: ConsumerGroup; groupKey: string; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  return <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-xl border border-slate-200 bg-slate-50/70">
    <div className="flex items-center gap-3 p-4">
      <div className="rounded-lg bg-violet-100 p-2 text-violet-700"><Users className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{group.group_id}</p><p className="text-xs text-slate-500">Consumer group</p></div>
      <Badge className="border-0 bg-emerald-100 text-emerald-800">{group.state}</Badge>
      <CollapsibleTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={open ? `Collapse ${group.group_id}` : `Expand ${group.group_id}`}><ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></Button></CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      <div className="space-y-4 border-t bg-white p-4">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Total consumers" value={group.status.total_consumers} />
          <Metric label="Working" value={group.status.working_consumers} tone="green" />
          <Metric label="Idle" value={group.status.idle_consumers} tone="amber" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic status</p><p className="truncate text-sm font-semibold text-slate-800">{group.topicStatus.name}</p></div><Badge variant="outline">{group.topicStatus.table.length} rows</Badge></div>
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Partition</TableHead><TableHead className="text-right">Current offset</TableHead><TableHead className="text-right">Log end offset</TableHead><TableHead className="text-right">Lag</TableHead></TableRow></TableHeader>
            <TableBody>{group.topicStatus.table.map((row, index) => <TableRow key={`${groupKey}-${row.partition}-${index}`}><TableCell>{row.partition}</TableCell><TableCell className="text-right tabular-nums">{row.current_offset}</TableCell><TableCell className="text-right tabular-nums">{row.log_end_offset}</TableCell><TableCell className={`text-right tabular-nums ${row.lag > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}`}>{row.lag}</TableCell></TableRow>)}</TableBody>
          </Table></div>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>;
}

function TopicNode({ id, data }: NodeProps<Node<TopicNodeData>>) {
  const { topic, expanded, expandedGroups, onToggleTopic, onToggleGroup } = data;
  const updateNodeInternals = useUpdateNodeInternals();
  // Re-measure the React Flow node after Radix has mounted/unmounted expanded content.
  useEffect(() => {
    const frame = requestAnimationFrame(() => updateNodeInternals(id));
    return () => cancelAnimationFrame(frame);
  }, [id, expanded, expandedGroups, updateNodeInternals]);

  return <div className={`w-[560px] rounded-2xl border bg-white p-5 shadow-md ${expanded ? "border-violet-300 shadow-lg" : "border-slate-300"}`}>
    <Handle id="topic-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
    <Collapsible open={expanded} onOpenChange={(open) => onToggleTopic(topic.id, open)}>
      <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Database className="h-7 w-7" /></div><div className="min-w-0 flex-1"><p className="truncate text-base font-bold text-slate-900">{topic.name}</p><Badge variant="secondary" className="mt-1 bg-violet-50 text-violet-800"><Layers3 className="mr-1 h-3 w-3" />{topic.number} Partitions</Badge></div>
        <CollapsibleTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={expanded ? "Collapse topic" : "Expand topic"}><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} /></Button></CollapsibleTrigger>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-sm text-slate-600"><Users className="h-4 w-4" /><span>{topic.groups.length} consumer {topic.groups.length === 1 ? "group" : "groups"}</span><span className="text-slate-400">·</span><span>{expanded ? "Consumer groups shown below" : "Expand to view consumer groups"}</span></div>
      <CollapsibleContent>
        <div className="space-y-3 pt-4">{topic.groups.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">No consumer groups found.</div> : topic.groups.map((group, index) => {
          const groupKey = `${topic.id}:${group.group_id}:${index}`;
          return <ConsumerGroupCard key={groupKey} group={group} groupKey={groupKey} open={expandedGroups.includes(groupKey)} onOpenChange={(open) => onToggleGroup(topic.id, groupKey, open)} />;
        })}</div>
      </CollapsibleContent>
    </Collapsible>
  </div>;
}

const nodeTypes = { cluster: ClusterNode, broker: BrokerNode, topic: TopicNode };
const TOPIC_WIDTH = 560;
const TOPIC_GAP = 44;

function buildGraph(cluster: KafkaCluster, expandedTopics: string[], expandedGroups: Record<string, string[]>, brokerExpanded: boolean,
  onToggleTopic: (id: string, open: boolean) => void, onToggleGroup: (topicId: string, groupKey: string, open: boolean) => void, onToggleBroker: (open: boolean) => void) {
  const broker = cluster.brokers[0];
  const topics = brokerExpanded ? broker?.topics ?? [] : [];
  const width = Math.max(TOPIC_WIDTH, topics.length * TOPIC_WIDTH + Math.max(0, topics.length - 1) * TOPIC_GAP);
  const startX = -width / 2;
  const nodes: Node[] = [
    { id: "cluster", type: "cluster", position: { x: -195, y: 20 }, data: { title: cluster.name, status: cluster.status }, draggable: false },
    ...(broker ? [{ id: broker.id, type: "broker", position: { x: -195, y: 230 }, data: { title: broker.name, subtitle: broker.id, status: broker.status, expanded: brokerExpanded, onToggle: onToggleBroker }, draggable: false } as Node] : []),
    ...topics.map((topic, index) => ({ id: topic.id, type: "topic", position: { x: startX + index * (TOPIC_WIDTH + TOPIC_GAP), y: 430 }, data: { topic, expanded: expandedTopics.includes(topic.id), expandedGroups: expandedGroups[topic.id] ?? [], onToggleTopic, onToggleGroup }, draggable: false } as Node)),
  ];
  const edges: Edge[] = [
    ...(broker ? [{ id: "cluster-broker", source: "cluster", sourceHandle: "cluster-out", target: broker.id, targetHandle: "broker-in", type: "smoothstep", style: { stroke: "#64748b", strokeWidth: 2 } } as Edge] : []),
    ...topics.map((topic) => ({ id: `broker-${topic.id}`, source: broker?.id ?? "", sourceHandle: "broker-out", target: topic.id, targetHandle: "topic-in", type: "smoothstep" as const, style: { stroke: "#64748b", strokeWidth: 2 } })),
  ];
  return { nodes, edges };
}

function KafkaHierarchyCanvas() {
  const [cluster] = useState(initialKafkaData);
  const [brokerExpanded, setBrokerExpanded] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, string[]>>({});
  const { fitView } = useReactFlow();

  function toggleTopic(topicId: string, open: boolean) {
    setExpandedTopics((current) => open ? (current.includes(topicId) ? current : [...current, topicId]) : current.filter((id) => id !== topicId));
  }
  function toggleGroup(topicId: string, groupKey: string, open: boolean) {
    setExpandedGroups((current) => {
      const existing = current[topicId] ?? [];
      const next = open ? (existing.includes(groupKey) ? existing : [...existing, groupKey]) : existing.filter((key) => key !== groupKey);
      return { ...current, [topicId]: next };
    });
  }
  function toggleBroker(open: boolean) {
    setBrokerExpanded(open);
    if (!open) { setExpandedTopics([]); setExpandedGroups({}); }
  }

  const graph = buildGraph(cluster, expandedTopics, expandedGroups, brokerExpanded, toggleTopic, toggleGroup, toggleBroker);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    // Keep the viewport stable while expanding nested content; only fit on broker visibility changes.
  }, [cluster, brokerExpanded, expandedTopics, expandedGroups]);

  useEffect(() => {
    if (brokerExpanded) {
      const frame = requestAnimationFrame(() => fitView({ padding: 0.16, duration: 200, minZoom: 0.25, maxZoom: 1 }));
      return () => cancelAnimationFrame(frame);
    }
  }, [brokerExpanded, fitView]);

  return <div className="flex h-[850px] min-h-[650px] w-full flex-col overflow-hidden rounded-2xl border bg-slate-50">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-900"><Network className="h-7 w-7" /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-950">Kafka Hierarchy</h1><p className="text-sm text-slate-500">Cluster → Broker → Topics → Consumer groups and partition status</p></div></div><Badge className="border-0 bg-emerald-100 px-3 py-1.5 text-emerald-800"><Activity className="mr-1.5 h-3.5 w-3.5" />Cluster: {cluster.status}</Badge></header>
    <div className="min-h-0 flex-1"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes}
      fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.2} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: "smoothstep", interactionWidth: 20 }}>
      <Background color="#cbd5e1" gap={22} size={1} /><Controls showInteractive={false} position="bottom-right" />
    </ReactFlow></div>
  </div>;
}

export default function KafkaHierarchy() {
  return <ReactFlowProvider><KafkaHierarchyCanvas /></ReactFlowProvider>;
}
