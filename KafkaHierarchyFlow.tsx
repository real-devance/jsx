import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState, type ReactNode } from "react";

export type Consumer = {
  id: string;
  name: string;
  status: "Running" | "Offline";
};

export type ConsumerGroup = {
  id: string;
  name: string;
  consumers: Consumer[];
};

export type Topic = {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  partitions: number;
  replication: number;
  messages: string;
  lag: number;
  throughput: string;
  groups: ConsumerGroup[];
};

export type Broker = {
  id: string;
  name: string;
  host: string;
  status: "Online" | "Offline";
  topics: Topic[];
};

export type KafkaData = {
  name: string;
  status: "Healthy" | "Degraded";
  brokers: Broker[];
};

type ToggleData = {
  title: string;
  subtitle?: string;
  status?: string;
  expanded?: boolean;
  onToggle?: () => void;
};

type ClusterNodeData = ToggleData & { brokerCount: number };
type BrokerNodeData = ToggleData & { idLabel: string; topicCount: number };
type TopicNodeData = ToggleData & {
  partitions: number;
  replication: number;
  messages: string;
  lag: number;
  throughput: string;
};
type GroupNodeData = ToggleData & { consumerCount: number };
type ConsumerNodeData = ToggleData;

const initialKafkaData: KafkaData = {
  name: "kafka-cluster-1",
  status: "Healthy",
  brokers: [
    {
      id: "broker-1",
      name: "Broker-1",
      host: "kafka:9092",
      status: "Online",
      topics: [
        {
          id: "orders",
          name: "orders",
          status: "Active",
          partitions: 3,
          replication: 1,
          messages: "1,240,320",
          lag: 0,
          throughput: "12.4k msg/s",
          groups: [
            {
              id: "orders-service",
              name: "orders-service",
              consumers: [
                { id: "orders-c1", name: "Consumer-1", status: "Running" },
                { id: "orders-c2", name: "Consumer-2", status: "Running" },
              ],
            },
          ],
        },
        {
          id: "payments",
          name: "payments",
          status: "Active",
          partitions: 6,
          replication: 1,
          messages: "842,991",
          lag: 12,
          throughput: "8.7k msg/s",
          groups: [
            {
              id: "payments-service",
              name: "payments-service",
              consumers: [
                { id: "payments-c1", name: "Consumer-1", status: "Running" },
                { id: "payments-c2", name: "Consumer-2", status: "Running" },
              ],
            },
          ],
        },
        {
          id: "notifications",
          name: "notifications",
          status: "Active",
          partitions: 3,
          replication: 1,
          messages: "210,432",
          lag: 0,
          throughput: "3.1k msg/s",
          groups: [
            {
              id: "notification-service",
              name: "notification-service",
              consumers: [
                { id: "notifications-c1", name: "Consumer-1", status: "Running" },
              ],
            },
          ],
        },
        {
          id: "audit-logs",
          name: "audit-logs",
          status: "Active",
          partitions: 4,
          replication: 1,
          messages: "5,782,110",
          lag: 24,
          throughput: "18.9k msg/s",
          groups: [
            {
              id: "audit-service",
              name: "audit-service",
              consumers: [
                { id: "audit-c1", name: "Consumer-1", status: "Running" },
                { id: "audit-c2", name: "Consumer-2", status: "Running" },
                { id: "audit-c3", name: "Consumer-3", status: "Running" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const topicWidth = 300;
const topicGap = 36;
const brokerGap = 90;
const brokerTop = 150;
const topicTop = 320;
const groupTop = 535;
const consumerTop = 625;

function statusClass(status?: string) {
  return status === "Offline" || status === "Inactive" || status === "Degraded"
    ? "bg-rose-100 text-rose-700"
    : "bg-emerald-100 text-emerald-700";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function NodeShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function ClusterNode({ data }: NodeProps<Node<ClusterNodeData>>) {
  return (
    <NodeShell className="w-[390px] border-fuchsia-200 px-5 py-4 shadow-[0_3px_12px_rgba(124,58,237,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-fuchsia-50 text-2xl text-fuchsia-700">✣</div>
          <div>
            <div className="text-lg font-bold text-slate-900">{data.title}</div>
            <div className="text-xs text-slate-500">Cluster: {data.subtitle} · Brokers: {data.brokerCount}</div>
          </div>
        </div>
        <StatusPill status={data.status ?? "Healthy"} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
    </NodeShell>
  );
}

function BrokerNode({ data }: NodeProps<Node<BrokerNodeData>>) {
  return (
    <NodeShell className="w-[260px] border-sky-200 px-4 py-3">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-xl text-sky-700">▤</div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900">{data.title}</div>
          <div className="text-xs text-slate-500">{data.subtitle} · {data.topicCount} topics</div>
        </div>
        <StatusPill status={data.status ?? "Online"} />
      </div>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); data.onToggle?.(); }}
        className="nodrag mt-3 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
        aria-label={data.expanded ? "Collapse broker" : "Expand broker"}
      >
        {data.expanded ? "− Collapse topics" : "+ Expand topics"}
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
    </NodeShell>
  );
}

function TopicNode({ data }: NodeProps<Node<TopicNodeData>>) {
  return (
    <NodeShell className="w-[300px] overflow-hidden border-violet-200">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg text-violet-700">▱</span>
          <span className="font-bold text-slate-900">{data.title}</span>
        </div>
        <StatusPill status={data.status ?? "Active"} />
      </div>
      <div className="px-4 py-2 text-xs text-slate-500">
        Partitions: <b className="text-slate-800">{data.partitions}</b>
        <span className="mx-2">·</span>
        Replication: <b className="text-slate-800">{data.replication}</b>
      </div>
      <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-amber-200">
        <div className="bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">▥ Topic Status</div>
        <div className="space-y-1.5 px-3 py-2 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Messages</span><b>{data.messages}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Lag</span><b className={data.lag > 0 ? "text-amber-700" : "text-emerald-700"}>{data.lag}</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Throughput</span><b>{data.throughput}</b></div>
        </div>
      </div>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); data.onToggle?.(); }}
        className="nodrag mx-3 mb-3 w-[calc(100%-24px)] rounded-lg border border-violet-200 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
      >
        {data.expanded ? "− Hide consumer groups" : "+ Show consumer groups"}
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
    </NodeShell>
  );
}

function GroupNode({ data }: NodeProps<Node<GroupNodeData>>) {
  return (
    <NodeShell className="w-[270px] border-sky-200 bg-sky-50/70 px-3 py-2">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center gap-2">
        <span className="text-sky-700">♟</span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{data.title}</span>
        <span className="text-xs text-slate-500">{data.consumerCount}</span>
      </div>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); data.onToggle?.(); }}
        className="nodrag mt-2 rounded-md border border-sky-200 bg-white px-2 py-0.5 text-[11px] font-medium text-sky-700 hover:bg-sky-50"
      >
        {data.expanded ? "− Hide consumers" : "+ Show consumers"}
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
    </NodeShell>
  );
}

function ConsumerNode({ data }: NodeProps<Node<ConsumerNodeData>>) {
  return (
    <NodeShell className="w-[220px] border-slate-200 px-3 py-2">
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-sky-700">▣</span>{data.title}
        </div>
        <StatusPill status={data.status ?? "Running"} />
      </div>
    </NodeShell>
  );
}

const nodeTypes = {
  cluster: ClusterNode,
  broker: BrokerNode,
  topic: TopicNode,
  group: GroupNode,
  consumer: ConsumerNode,
};

/**
 * Builds a top-down tree from the API-shaped Kafka object.
 * Each topic gets its own column. Consumer groups and consumers are
 * positioned underneath their parent topic, so adding data needs no
 * hand-authored node coordinates.
 */
function buildGraph(
  kafka: KafkaData,
  expanded: Record<string, boolean>,
  toggle: (id: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const brokerWidths = kafka.brokers.map((broker) => Math.max(1, broker.topics.length) * (topicWidth + topicGap) - topicGap);
  const totalWidth = brokerWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, kafka.brokers.length - 1) * brokerGap;
  let brokerStart = -totalWidth / 2;

  nodes.push({
    id: "cluster",
    type: "cluster",
    position: { x: -195, y: 0 },
    data: {
      title: "Kafka Cluster",
      subtitle: kafka.name,
      status: kafka.status,
      brokerCount: kafka.brokers.length,
    },
    draggable: false,
  });

  kafka.brokers.forEach((broker, brokerIndex) => {
    const width = brokerWidths[brokerIndex];
    const brokerCenter = brokerStart + width / 2;
    const brokerExpanded = expanded[broker.id] !== false;
    nodes.push({
      id: broker.id,
      type: "broker",
      position: { x: brokerCenter - 130, y: brokerTop },
      data: {
        title: broker.name,
        subtitle: broker.host,
        idLabel: broker.id,
        status: broker.status,
        topicCount: broker.topics.length,
        expanded: brokerExpanded,
        onToggle: () => toggle(broker.id),
      },
      draggable: false,
    });
    edges.push({ id: `cluster-${broker.id}`, source: "cluster", target: broker.id, type: "smoothstep" });

    if (brokerExpanded) {
      broker.topics.forEach((topic, topicIndex) => {
        const x = brokerStart + topicIndex * (topicWidth + topicGap);
        const topicExpanded = expanded[topic.id] !== false;
        nodes.push({
          id: topic.id,
          type: "topic",
          position: { x, y: topicTop },
          data: {
            title: topic.name,
            status: topic.status,
            partitions: topic.partitions,
            replication: topic.replication,
            messages: topic.messages,
            lag: topic.lag,
            throughput: topic.throughput,
            expanded: topicExpanded,
            onToggle: () => toggle(topic.id),
          },
          draggable: false,
        });
        edges.push({ id: `${broker.id}-${topic.id}`, source: broker.id, target: topic.id, type: "smoothstep" });

        if (topicExpanded) {
          topic.groups.forEach((group, groupIndex) => {
            const groupId = `${topic.id}::${group.id}`;
            const groupExpanded = expanded[groupId] !== false;
            const groupY = groupTop + groupIndex * 125;
            nodes.push({
              id: groupId,
              type: "group",
              position: { x: x + (topicWidth - 270) / 2, y: groupY },
              data: {
                title: group.name,
                consumerCount: group.consumers.length,
                expanded: groupExpanded,
                onToggle: () => toggle(groupId),
              },
              draggable: false,
            });
            edges.push({ id: `${topic.id}-${groupId}`, source: topic.id, target: groupId, type: "smoothstep" });

            if (groupExpanded) {
              group.consumers.forEach((consumer, consumerIndex) => {
                const consumerId = `${groupId}::${consumer.id}`;
                nodes.push({
                  id: consumerId,
                  type: "consumer",
                  position: {
                    x: x + (topicWidth - 220) / 2,
                    y: consumerTop + groupIndex * 125 + consumerIndex * 62,
                  },
                  data: { title: consumer.name, status: consumer.status },
                  draggable: false,
                });
                edges.push({ id: `${groupId}-${consumerId}`, source: groupId, target: consumerId, type: "smoothstep" });
              });
            }
          });
        }
      });
    }
    brokerStart += width + brokerGap;
  });

  return { nodes, edges };
}

export default function KafkaHierarchyFlow({
  data = initialKafkaData,
}: {
  data?: KafkaData;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((current) => ({ ...current, [id]: current[id] === false }));

  const graph = useMemo(() => buildGraph(data, expanded, toggle), [data, expanded]);

  return (
    <div className="h-[820px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Kafka topology</h2>
          <p className="text-xs text-slate-500">Vertical hierarchy · live cluster overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy cluster
        </div>
      </div>
      <div className="h-[calc(100%-61px)] w-full">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            style: { stroke: "#64748b", strokeWidth: 1.8 },
          }}
        >
          <Background color="#cbd5e1" gap={22} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => {
              if (node.type === "cluster") return "#d8b4fe";
              if (node.type === "broker") return "#7dd3fc";
              if (node.type === "topic") return "#c4b5fd";
              if (node.type === "group") return "#bae6fd";
              return "#e2e8f0";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// Replace `initialKafkaData` with your API response, or pass it as `data`.
// Example: <KafkaHierarchyFlow data={kafkaApiResponse} />
