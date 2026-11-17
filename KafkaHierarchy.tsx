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
import { Skeleton } from "@/components/ui/skeleton";
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
  LayoutGrid,
  Network,
  RefreshCw,
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

type TopicNodeData = {
  topic: KafkaTopic;
  expanded: boolean;
  loading: boolean;
  onToggle: (topicId: string) => void;
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

// Replace these placeholder paths with the real API endpoints.
async function fetchKafkaCluster(): Promise<KafkaCluster> {
  const response = await fetch("/api/kafka/cluster", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load Kafka cluster");
  return response.json();
}

async function fetchTopicConsumerGroups(topicId: string): Promise<ConsumerGroup[]> {
  const response = await fetch(
    `/api/kafka/topics/${encodeURIComponent(topicId)}/consumer-groups`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Unable to load consumer groups for ${topicId}`);
  return response.json();
}

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

function BrokerNode({ data }: NodeProps<Node<CommonNodeData>>) {
  return (
    <div className="w-[390px] rounded-2xl border border-slate-300 bg-white p-5 shadow-md">
      <Handle id="broker-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <Handle id="broker-out" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 p-4 text-blue-700"><Server className="h-8 w-8" /></div>
        <div className="min-w-0 flex-1"><p className="text-xl font-bold text-slate-900">{data.title}</p><p className="mt-1 text-sm text-slate-500">{data.subtitle}</p></div>
        <Badge className="border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CircleDot className="mr-1 h-3 w-3" />{data.status}</Badge>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "amber" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 text-xl font-bold tabular-nums ${color}`}>{value}</p></div>;
}

function TopicNode({ id, data }: NodeProps<Node<TopicNodeData>>) {
  const { topic, expanded, loading, onToggle } = data;
  const updateNodeInternals = useUpdateNodeInternals();

  // React Flow caches node dimensions. Re-measure after opening/closing so the
  // node body, hit area and connected edge endpoints all use the new height.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, expanded, loading, topic.groups, updateNodeInternals]);

  return (
    <div className={`w-[500px] rounded-2xl border bg-white p-5 shadow-md transition-shadow ${expanded ? "border-violet-300 shadow-lg" : "border-slate-300"}`}>
      <Handle id="topic-in" type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-slate-500" />
      <Collapsible open={expanded} onOpenChange={() => onToggle(topic.id)}>
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
            {loading ? (
              <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-4 w-40" /></div>
                <div className="grid grid-cols-3 gap-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
                <Skeleton className="h-28 w-full" /><p className="text-xs text-slate-500">Loading consumer groups and topic status…</p>
              </div>
            ) : topic.groups.length === 0 ? (
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
const TOPIC_WIDTH = 500;
const TOPIC_GAP = 48;

function makeLayout(cluster: KafkaCluster, expandedTopics: string[], loadingTopics: string[], onToggle: (id: string) => void) {
  const broker = cluster.brokers[0];
  const topics = broker?.topics ?? [];
  const totalWidth = topics.length * TOPIC_WIDTH + Math.max(0, topics.length - 1) * TOPIC_GAP;
  const startX = -totalWidth / 2;
  const nodes: Node[] = [
    { id: "cluster", type: "cluster", position: { x: -195, y: 40 }, data: { title: cluster.name, status: cluster.status }, draggable: false },
    ...(broker ? [{ id: broker.id, type: "broker", position: { x: -195, y: 260 }, data: { title: broker.name, subtitle: broker.id, status: broker.status }, draggable: false } as Node] : []),
    ...topics.map((topic, index) => ({
      id: topic.id,
      type: "topic",
      position: { x: startX + index * (TOPIC_WIDTH + TOPIC_GAP), y: 500 },
      data: { topic, expanded: expandedTopics.includes(topic.id), loading: loadingTopics.includes(topic.id), onToggle },
      draggable: false,
    } as Node)),
  ];
  const edges: Edge[] = [
    ...(broker ? [{ id: "cluster-broker", source: "cluster", sourceHandle: "cluster-out", target: broker.id, targetHandle: "broker-in", type: "smoothstep", style: { stroke: "#64748b", strokeWidth: 2 } } as Edge] : []),
    ...topics.map((topic) => ({ id: `broker-${topic.id}`, source: broker?.id ?? "", sourceHandle: "broker-out", target: topic.id, targetHandle: "topic-in", type: "smoothstep" as const, style: { stroke: "#64748b", strokeWidth: 2 } })),
  ];
  return { nodes, edges };
}

function KafkaHierarchyCanvas() {
  const [cluster, setCluster] = useState<KafkaCluster>(initialKafkaData);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { fitView } = useReactFlow();
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>(
    makeLayout(initialKafkaData, [], [], toggleTopic).nodes,
  );
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>(
    makeLayout(initialKafkaData, [], [], toggleTopic).edges,
  );

  async function toggleTopic(topicId: string) {
    if (expandedTopics.includes(topicId)) {
      setExpandedTopics((current) => current.filter((id) => id !== topicId));
      return;
    }
    setExpandedTopics((current) => [...current, topicId]);
    setLoadingTopics((current) => current.includes(topicId) ? current : [...current, topicId]);
    try {
      const groups = await fetchTopicConsumerGroups(topicId);
      setCluster((current) => ({
        ...current,
        brokers: current.brokers.map((broker) => ({
          ...broker,
          topics: broker.topics.map((topic) => topic.id === topicId ? { ...topic, groups } : topic),
        })),
      }));
    } catch {
      // The supplied mock groups remain visible if the placeholder API is offline.
    } finally {
      setLoadingTopics((current) => current.filter((id) => id !== topicId));
    }
  }

  async function refreshCluster() {
    setRefreshing(true);
    try {
      const data = await fetchKafkaCluster();
      setCluster(data);
      setApiError(null);
    } catch {
      setApiError("API is not connected yet. Showing the supplied mock data.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchKafkaCluster()
      .then((data) => { if (active) { setCluster(data); setApiError(null); } })
      .catch(() => { if (active) setApiError("API is not connected yet. Showing the supplied mock data."); });
    return () => { active = false; };
  }, []);

  const layout = makeLayout(cluster, expandedTopics, loadingTopics, toggleTopic);

  // Keep React Flow controlled state synchronized with the latest hierarchy.
  useEffect(() => {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
  }, [cluster, expandedTopics, loadingTopics]);

  function autoLayout() {
    setFlowNodes(layout.nodes);
    setFlowEdges(layout.edges);
    requestAnimationFrame(() => fitView({ padding: 0.16, duration: 350, minZoom: 0.35, maxZoom: 1 }));
  }

  return (
    <div className="flex h-[850px] min-h-[650px] w-full flex-col overflow-hidden rounded-2xl border bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-2.5 text-slate-900"><Network className="h-7 w-7" /></div><div><h1 className="text-xl font-bold tracking-tight text-slate-950">Kafka Hierarchy</h1><p className="text-sm text-slate-500">Cluster, brokers, topics and consumer groups</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-emerald-100 px-3 py-1.5 text-emerald-800 hover:bg-emerald-100"><Activity className="mr-1.5 h-3.5 w-3.5" />Cluster: {cluster.status}</Badge>
          <Button variant="outline" size="sm" onClick={refreshCluster} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>
          <Button variant="outline" size="sm" onClick={autoLayout}><LayoutGrid className="mr-2 h-4 w-4" />Auto layout</Button>
        </div>
      </header>
      {apiError && <div className="border-b bg-amber-50 px-6 py-2 text-xs text-amber-800">{apiError}</div>}
      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16, minZoom: 0.35, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep", interactionWidth: 20 }}
        >
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
