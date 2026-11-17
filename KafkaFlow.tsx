import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronDown, MessageSquare, Server, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

/* ----------------------------- Types & data ----------------------------- */

interface PartitionRow {
  partition: number;
  current_offset: number;
  log_end_offset: number;
  lag: number;
}

interface ConsumerGroup {
  group_id: string;
  state: string;
  status: {
    total_consumers: number;
    working_consumers: number;
    idle_consumers: number;
  };
  topicStatus: {
    id: string;
    name: string;
    table: PartitionRow[];
  };
}

interface Topic {
  id: string;
  name: string;
  number: string;
  groups: ConsumerGroup[];
}

interface Broker {
  id: string;
  name: string;
  status: string;
  topics: Topic[];
}

interface KafkaCluster {
  name: string;
  status: string;
  brokers: Broker[];
}

const row = (partition: number, cur = 239, end = 239): PartitionRow => ({
  partition,
  current_offset: cur,
  log_end_offset: end,
  lag: 0,
});

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
                table: [row(3), row(3), row(3), row(3), row(3)],
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
                table: [row(3), row(3), row(3), row(3), row(3)],
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
                table: [row(3), row(4), row(5), row(0, 213, 223)],
              },
            },
          ],
        },
      ],
    },
  ],
};

/* ------------------------------ Small helpers ---------------------------- */

const stateStyle = (s: string) =>
  s === "STABLE"
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    : "bg-amber-100 text-amber-700 hover:bg-amber-100";

const statusStyle = (s: string) =>
  ["Healthy", "Online"].includes(s)
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    : "bg-red-100 text-red-700 hover:bg-red-100";

// Lag is derived from offsets so it never disagrees with the numbers shown.
const calcLag = (r: PartitionRow) => Math.max(r.log_end_offset - r.current_offset, 0);

const lagStyle = (lag: number) =>
  lag === 0
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    : lag <= 100
    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
    : "bg-red-100 text-red-700 hover:bg-red-100";

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className={cn("flex-1 rounded-md px-2 py-1.5", className)}>
      <div className="text-[11px] leading-none">{label}</div>
      <div className="mt-1 text-lg font-medium leading-none">{value}</div>
    </div>
  );
}

/* --------------------------------- Nodes --------------------------------- */

type ClusterData = { name: string; status: string };
type BrokerData = {
  name: string;
  status: string;
  topicCount: number;
  open: boolean;
  onToggle: () => void;
};
type TopicData = { topic: Topic; open: boolean; onToggle: () => void };

function ClusterNode({ data }: NodeProps<Node<ClusterData>>) {
  return (
    <Card className="w-[320px] overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_8px_28px_-12px_rgba(15,23,42,0.22)]">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Kafka cluster</div>
            <div className="mt-0.5 text-sm font-semibold tracking-tight">{data.name}</div>
          </div>
        </div>
        <Badge className={cn("rounded-full border-0 px-2.5 py-1 text-[10px] font-semibold", statusStyle(data.status))}>{data.status}</Badge>
      </CardContent>
      <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500" />
    </Card>
  );
}

function BrokerNode({ data }: NodeProps<Node<BrokerData>>) {
  return (
    <Card className="w-[320px] overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_8px_28px_-12px_rgba(15,23,42,0.22)]">
      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-sky-500" />
      <Collapsible open={data.open} onOpenChange={data.onToggle}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Broker node</div>
                <div className="mt-0.5 text-sm font-semibold tracking-tight">{data.name}</div>
              </div>
            </div>
            <Badge className={cn("rounded-full border-0 px-2.5 py-1 text-[10px] font-semibold", statusStyle(data.status))}>{data.status}</Badge>
          </div>
          <CollapsibleTrigger className="nodrag mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <span>Topics ({data.topicCount})</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", !data.open && "-rotate-90")}
            />
          </CollapsibleTrigger>
        </CardContent>
      </Collapsible>
      <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-sky-500" />
    </Card>
  );
}

function TopicNode({ data }: NodeProps<Node<TopicData>>) {
  const { topic, open, onToggle } = data;

  return (
    <Card className="w-[320px] overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_8px_28px_-12px_rgba(15,23,42,0.2)]">
      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-violet-500" />
      <Collapsible open={open} onOpenChange={onToggle}>
        <CardHeader className="p-4">
          <CollapsibleTrigger className="nodrag flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <MessageSquare className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold tracking-tight">{topic.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {topic.number} partitions
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")}
            />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="nodrag nowheel space-y-3 border-t border-slate-100 p-4 pt-3">
            {topic.groups.map((g) => (
              <div key={g.group_id} className="space-y-3">
                {/* Consumer group card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="mb-1.5 text-[11px] text-muted-foreground">
                    Consumer group
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold tracking-tight">{g.group_id}</span>
                    <Badge className={cn("rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold", stateStyle(g.state))}>{g.state}</Badge>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Stat
                      label="Total"
                      value={g.status.total_consumers}
                      className="bg-blue-100 text-blue-700"
                    />
                    <Stat
                      label="Working"
                      value={g.status.working_consumers}
                      className="bg-emerald-100 text-emerald-700"
                    />
                    <Stat
                      label="Idle"
                      value={g.status.idle_consumers}
                      className={
                        g.status.idle_consumers > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      }
                    />
                  </div>
                </div>

                {/* Topic status card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Topic status · {g.topicStatus.name}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Partition</TableHead>
                        <TableHead className="h-8 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Current</TableHead>
                        <TableHead className="h-8 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">End</TableHead>
                        <TableHead className="h-8 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.topicStatus.table.map((r, i) => {
                        const lag = calcLag(r);
                        return (
                          <TableRow key={`${r.partition}-${i}`}>
                            <TableCell className="px-1 py-1.5 font-mono text-[11px]">
                              {r.partition}
                            </TableCell>
                            <TableCell className="px-1 py-1.5 font-mono text-[11px]">
                              {r.current_offset}
                            </TableCell>
                            <TableCell className="px-1 py-1.5 font-mono text-[11px]">
                              {r.log_end_offset}
                            </TableCell>
                            <TableCell className="px-1 py-1.5">
                              <Badge className={cn("rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold", lagStyle(lag))}>{lag}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Defined outside the component so React Flow doesn't re-register on every render.
const nodeTypes = {
  cluster: ClusterNode,
  broker: BrokerNode,
  topic: TopicNode,
};

/* --------------------------------- Layout -------------------------------- */

const NODE_W = 320;
const GAP_X = 40;
const CLUSTER_Y = 0;
const BROKER_Y = 175;
const TOPIC_Y = 390;

export default function KafkaFlow({
  data = initialKafkaData,
}: {
  data?: KafkaCluster;
}) {
  // Single broker in the sample data; extend by looping brokers if needed.
  const broker = data.brokers[0];

  const [brokerOpen, setBrokerOpen] = useState(true);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(broker.topics.map((t) => [t.id, true]))
  );

  const toggleBroker = () => setBrokerOpen((v) => !v);
  const toggleTopic = (id: string) =>
    setOpenTopics((s) => ({ ...s, [id]: !s[id] }));

  const { nodes, edges } = (() => {
    const count = broker.topics.length;
    const totalW = count * NODE_W + (count - 1) * GAP_X;
    const centerX = totalW / 2 - NODE_W / 2;

    const nodes: Node[] = [
      {
        id: "cluster",
        type: "cluster",
        position: { x: centerX, y: CLUSTER_Y },
        data: { name: data.name, status: data.status } satisfies ClusterData,
        draggable: false,
      },
      {
        id: broker.id,
        type: "broker",
        position: { x: centerX, y: BROKER_Y },
        data: {
          name: broker.name,
          status: broker.status,
          topicCount: count,
          open: brokerOpen,
          onToggle: toggleBroker,
        } satisfies BrokerData,
        draggable: false,
      },
    ];

    const edges: Edge[] = [
      {
        id: "e-cluster-broker",
        source: "cluster",
        target: broker.id,
        type: "smoothstep",
        style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: "none" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      },
    ];

    if (brokerOpen) {
      broker.topics.forEach((t, i) => {
        nodes.push({
          id: t.id,
          type: "topic",
          position: { x: i * (NODE_W + GAP_X), y: TOPIC_Y },
          data: {
            topic: t,
            open: !!openTopics[t.id],
            onToggle: () => toggleTopic(t.id),
          } satisfies TopicData,
        });
        edges.push({
          id: `e-${broker.id}-${t.id}`,
          source: broker.id,
          target: t.id,
          type: "smoothstep",
          style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: "none" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
        });
      });
    }

    return { nodes, edges };
  })();

  return (
    <div className="h-screen w-full bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.28 }}
        nodesConnectable={false}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#dbe3ee" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
