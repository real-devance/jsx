"use client";

/**
 * KafkaFlowChart
 * -----------------------------------------------------------------------------
 * A reusable, data-driven Apache Kafka flow chart built with React Flow.
 *
 * Dependencies:
 *   npm install @xyflow/react lucide-react
 *
 * shadcn/ui components used (add them if they are not already installed):
 *   npx shadcn@latest add button badge collapsible
 *
 * Usage:
 *   import KafkaFlowChart from "./flowchart";
 *
 *   export default function Page() {
 *     return <KafkaFlowChart />;
 *   }
 *
 * Notes:
 * - The mock tree below deliberately demonstrates nodes with 0–4 children.
 * - A node with children can be expanded/collapsed using its chevron button.
 * - Collapsing a node hides its descendants and their connecting edges.
 * - Replace `kafkaMockData` with data from your API when needed.
 */

import { useState } from "react";
import {
  Background,
  BackgroundVariant,
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
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  Layers3,
  Server,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// -----------------------------------------------------------------------------
// 1. Data model
// -----------------------------------------------------------------------------

/** A node in the source tree. Children are optional, so leaf nodes are valid. */
export type KafkaTreeItem = {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  kind: "cluster" | "broker" | "producer" | "consumer" | "topic" | "partition" | "status";
  description?: string;
  children?: KafkaTreeItem[];
};

/** Data passed to the custom React Flow node renderer. */
type KafkaNodeData = {
  item: KafkaTreeItem;
  expanded: boolean;
  hasChildren: boolean;
  onToggle: (id: string) => void;
};

type KafkaFlowNode = Node<KafkaNodeData, "kafkaNode">;

/**
 * Example Kafka topology.
 *
 * It mirrors the supplied sketch (broker → producer/consumer → consumed/pending)
 * and adds topics/partitions so the chart demonstrates a realistic hierarchy.
 * Branches intentionally contain 0, 1, 2, 3 and 4 children.
 */
export const kafkaMockData: KafkaTreeItem = {
  id: "cluster",
  title: "Kafka Cluster",
  subtitle: "Production environment",
  value: "3 brokers",
  kind: "cluster",
  description: "A Kafka cluster coordinates brokers, producers, topics and consumers.",
  children: [
    {
      id: "broker-1",
      title: "Broker 1",
      subtitle: "Leader broker",
      value: "Healthy",
      kind: "broker",
      description: "Accepts records from producers and serves consumer fetch requests.",
      children: [
        {
          id: "producer-group",
          title: "Producer group",
          subtitle: "2 active producers",
          value: "18.4k msg/s",
          kind: "producer",
          description: "Applications publishing records to Kafka topics.",
          children: [
            {
              id: "topic-orders",
              title: "orders",
              subtitle: "Topic",
              value: "12 partitions",
              kind: "topic",
              description: "Order events published by the checkout service.",
              children: [
                { id: "orders-p0", title: "Partition 0", subtitle: "Leader: B1", value: "4.8k records", kind: "partition" },
                { id: "orders-p1", title: "Partition 1", subtitle: "Leader: B2", value: "4.1k records", kind: "partition" },
                { id: "orders-p2", title: "Partition 2", subtitle: "Leader: B3", value: "3.9k records", kind: "partition" },
                { id: "orders-p3", title: "Partition 3", subtitle: "Leader: B1", value: "5.6k records", kind: "partition" },
              ],
            },
            {
              id: "topic-payments",
              title: "payments",
              subtitle: "Topic",
              value: "6 partitions",
              kind: "topic",
              description: "Payment authorization and settlement events.",
              children: [
                { id: "payments-p0", title: "Partition 0", subtitle: "Leader: B1", value: "2.2k records", kind: "partition" },
                { id: "payments-p1", title: "Partition 1", subtitle: "Leader: B2", value: "2.7k records", kind: "partition" },
              ],
            },
          ],
        },
        {
          id: "consumer-group",
          title: "Consumer group",
          subtitle: "2 active consumers",
          value: "Group: analytics-v2",
          kind: "consumer",
          description: "Consumers read records from assigned topic partitions.",
          children: [
            {
              id: "consumed",
              title: "Consumed",
              subtitle: "Successfully processed",
              value: "4.2k",
              kind: "status",
              description: "Records already read and acknowledged by the consumer group.",
            },
            {
              id: "pending",
              title: "Pending",
              subtitle: "Waiting to be processed",
              value: "24",
              kind: "status",
              description: "Records currently remaining in the consumer backlog.",
            },
          ],
        },
      ],
    },
    {
      id: "broker-2",
      title: "Broker 2",
      subtitle: "Replica broker",
      value: "Healthy",
      kind: "broker",
      description: "Stores replicated partitions and participates in leader election.",
      children: [
        {
          id: "topic-inventory",
          title: "inventory",
          subtitle: "Topic",
          value: "8 partitions",
          kind: "topic",
          description: "Stock updates from warehouse services.",
          children: [],
        },
        {
          id: "topic-shipping",
          title: "shipping",
          subtitle: "Topic",
          value: "4 partitions",
          kind: "topic",
          description: "Shipment lifecycle events.",
        },
        {
          id: "broker-2-replication",
          title: "Replication",
          subtitle: "Replica status",
          value: "In sync",
          kind: "partition",
          description: "Replica data is synchronized with its current leader.",
        },
      ],
    },
    {
      id: "broker-3",
      title: "Broker 3",
      subtitle: "Replica broker",
      value: "Healthy",
      kind: "broker",
      description: "Hosts replicas and balances partition storage across the cluster.",
      children: [
        {
          id: "broker-3-storage",
          title: "Storage",
          subtitle: "Disk utilization",
          value: "62% used",
          kind: "partition",
          description: "Local log segments stored on this broker.",
        },
      ],
    },
  ],
};

// -----------------------------------------------------------------------------
// 2. Visual helpers
// -----------------------------------------------------------------------------

/** Select a consistent icon for each Kafka entity type. */
function KindIcon({ kind }: { kind: KafkaTreeItem["kind"] }) {
  const iconClass = "h-4 w-4";

  switch (kind) {
    case "cluster":
      return <Workflow className={iconClass} />;
    case "broker":
      return <Server className={iconClass} />;
    case "producer":
      return <ArrowUpFromLine className={iconClass} />;
    case "consumer":
      return <ArrowDownToLine className={iconClass} />;
    case "topic":
      return <Database className={iconClass} />;
    case "partition":
      return <Layers3 className={iconClass} />;
    case "status":
      return <Activity className={iconClass} />;
    default:
      return <CircleDot className={iconClass} />;
  }
}

/** Tailwind classes for the node accent and icon background. */
function getKindStyles(kind: KafkaTreeItem["kind"]) {
  const styles = {
    cluster: "border-violet-200 bg-violet-50 text-violet-700",
    broker: "border-sky-200 bg-sky-50 text-sky-700",
    producer: "border-orange-200 bg-orange-50 text-orange-700",
    consumer: "border-emerald-200 bg-emerald-50 text-emerald-700",
    topic: "border-indigo-200 bg-indigo-50 text-indigo-700",
    partition: "border-slate-200 bg-slate-100 text-slate-700",
    status: "border-teal-200 bg-teal-50 text-teal-700",
  };

  return styles[kind];
}

// -----------------------------------------------------------------------------
// 3. Custom expandable node
// -----------------------------------------------------------------------------

/**
 * Each node uses shadcn Collapsible for its expand/collapse interaction.
 * React Flow renders the actual child nodes separately beneath the parent.
 */
function KafkaNodeView({ id, data }: NodeProps<KafkaFlowNode>) {
  const { item, expanded, hasChildren, onToggle } = data;
  const kindStyles = getKindStyles(item.kind);

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggle(id)}
      className="w-[248px]"
    >
      {/* Top handle receives an edge from the parent node. */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
      />

      {/* Main node surface. */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-14px_rgba(15,23,42,0.28)] transition-all hover:border-slate-300 hover:shadow-lg">
        <div className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Entity icon with a type-specific accent. */}
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${kindStyles}`}>
              <KindIcon kind={item.kind} />
            </div>

            {/* Title, subtitle and optional value. */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
                  {item.title}
                </p>
                {item.kind === "broker" && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                )}
              </div>
              {item.subtitle && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {item.subtitle}
                </p>
              )}
              {item.value && (
                <p className="mt-2 truncate text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              )}
            </div>

            {/* Only nodes with children show the collapse control. */}
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={expanded ? `Collapse ${item.title}` : `Expand ${item.title}`}
                  className="-mr-2 -mt-1 h-8 w-8 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
            )}
          </div>

          {/* Small metadata row keeps the node informative but uncluttered. */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <Badge variant="secondary" className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600">
              {item.kind}
            </Badge>
            {hasChildren ? (
              <span className="text-[10px] font-medium text-slate-400">
                {item.children!.length} {item.children!.length === 1 ? "child" : "children"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <CircleDot className="h-2.5 w-2.5" /> Leaf node
              </span>
            )}
          </div>
        </div>

        {/* Extra context appears when the node is expanded. */}
        <CollapsibleContent>
          {item.description && (
            <div className="border-t border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <p className="text-[10px] leading-relaxed text-slate-500">
                {item.description}
              </p>
            </div>
          )}
        </CollapsibleContent>
      </div>

      {/* Bottom handle connects this node to its visible children. */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
      />
    </Collapsible>
  );
}

// Define node types outside the component so React Flow receives a stable object.
const nodeTypes = { kafkaNode: KafkaNodeView };

// -----------------------------------------------------------------------------
// 4. Tree → React Flow graph conversion and simple automatic layout
// -----------------------------------------------------------------------------

const NODE_WIDTH = 248;
const NODE_HEIGHT = 154;
const HORIZONTAL_GAP = 76;
const VERTICAL_GAP = 104;

/** Count visible leaf slots so sibling branches can be centered neatly. */
function countVisibleLeaves(item: KafkaTreeItem, expandedIds: Set<string>): number {
  const children = item.children ?? [];

  if (children.length === 0 || !expandedIds.has(item.id)) return 1;

  return children.reduce(
    (total, child) => total + countVisibleLeaves(child, expandedIds),
    0,
  );
}

/**
 * Convert the nested mock/API tree into positioned React Flow nodes and edges.
 * The layout is top-down and centers each parent above its visible descendants.
 */
function buildGraph(
  root: KafkaTreeItem,
  expandedIds: Set<string>,
  onToggle: (id: string) => void,
) {
  const nodes: KafkaFlowNode[] = [];
  const edges: Edge[] = [];
  let leafCursor = 0;

  /** Recursively visit each visible item and assign its graph position. */
  function visit(item: KafkaTreeItem, depth: number) {
    const children = item.children ?? [];
    const isExpanded = expandedIds.has(item.id) && children.length > 0;
    const visibleChildren = isExpanded ? children : [];
    const startLeaf = leafCursor;

    // Reserve horizontal space for each visible descendant branch.
    const branchLeaves = visibleChildren.reduce(
      (total, child) => total + countVisibleLeaves(child, expandedIds),
      0,
    );

    // A collapsed node (or leaf) occupies one horizontal slot.
    const centerLeaf = visibleChildren.length > 0
      ? startLeaf + (branchLeaves - 1) / 2
      : leafCursor++;

    nodes.push({
      id: item.id,
      type: "kafkaNode",
      position: {
        x: centerLeaf * (NODE_WIDTH + HORIZONTAL_GAP),
        y: depth * (NODE_HEIGHT + VERTICAL_GAP),
      },
      data: {
        item,
        expanded: isExpanded,
        hasChildren: children.length > 0,
        onToggle,
      },
      draggable: true,
      selectable: true,
    });

    // Add child nodes and their edges only when this node is expanded.
    visibleChildren.forEach((child) => {
      const childId = child.id;
      edges.push({
        id: `${item.id}-${childId}`,
        source: item.id,
        target: childId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#94a3b8", strokeWidth: 1.6 },
      });
      visit(child, depth + 1);
    });
  }

  visit(root, 0);

  // Shift the entire graph so the root starts near the horizontal center.
  const minX = Math.min(...nodes.map((node) => node.position.x));
  const maxX = Math.max(...nodes.map((node) => node.position.x));
  const graphWidth = maxX - minX + NODE_WIDTH;
  const offsetX = -minX + Math.max(0, (graphWidth - NODE_WIDTH) / 2 - maxX);

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: { ...node.position, x: node.position.x + offsetX },
    })),
    edges,
  };
}

// -----------------------------------------------------------------------------
// 5. Main component
// -----------------------------------------------------------------------------

export type KafkaFlowChartProps = {
  /** Override the example tree with your own Kafka topology. */
  data?: KafkaTreeItem;
  /** Set false to hide the minimap. */
  showMiniMap?: boolean;
};

export default function KafkaFlowChart({
  data = kafkaMockData,
  showMiniMap = true,
}: KafkaFlowChartProps) {
  // Start with all nodes expanded; collapsing a parent hides its descendants.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    const collect = (item: KafkaTreeItem) => {
      if (item.children?.length) ids.add(item.id);
      item.children?.forEach(collect);
    };
    collect(data);
    return ids;
  });

  // Toggle a node's expanded state; React 19 Compiler handles optimization.
  function toggleNode(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Build the visible graph from the current tree and expansion state.
  const graph = buildGraph(data, expandedIds, toggleNode);

  // Expand every branch in the current data tree.
  function expandAll() {
    const ids = new Set<string>();
    const collect = (item: KafkaTreeItem) => {
      if (item.children?.length) ids.add(item.id);
      item.children?.forEach(collect);
    };
    collect(data);
    setExpandedIds(ids);
  }

  // Collapse all branches, leaving only the root visible.
  function collapseAll() {
    setExpandedIds(new Set());
  }

  // Count currently expanded branches for the small chart status label.
  const expandedCount = expandedIds.size;

  return (
    <section className="flex h-[min(850px,calc(100vh-2rem))] min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm">
      {/* Chart toolbar. */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Kafka topology
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Brokers, producers, consumers and topic flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Cluster healthy
          </Badge>
          <div className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex">
            <Clock3 className="h-3.5 w-3.5" />
            {expandedCount} expanded
          </div>
          <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 rounded-lg text-xs">
            Collapse all
          </Button>
          <Button size="sm" onClick={expandAll} className="h-8 rounded-lg bg-slate-900 text-xs text-white hover:bg-slate-700">
            Expand all
          </Button>
        </div>
      </header>

      {/* React Flow canvas. */}
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
          minZoom={0.2}
          maxZoom={1.5}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: "smoothstep" }}
          className="bg-slate-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
          <Controls
            showInteractive={false}
            className="!overflow-hidden !rounded-xl !border !border-slate-200 !bg-white !shadow-sm [&>button]:!border-slate-100 [&>button]:!fill-slate-600"
          />
          {showMiniMap && (
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => {
                const kind = (node.data as KafkaNodeData).item.kind;
                const colors: Record<KafkaTreeItem["kind"], string> = {
                  cluster: "#8b5cf6",
                  broker: "#0ea5e9",
                  producer: "#f97316",
                  consumer: "#10b981",
                  topic: "#6366f1",
                  partition: "#94a3b8",
                  status: "#14b8a6",
                };
                return colors[kind];
              }}
              className="!rounded-xl !border !border-slate-200 !bg-white !shadow-sm"
            />
          )}
        </ReactFlow>
      </div>

      {/* Small legend. */}
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-white px-5 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Node types
        </span>
        {[
          ["Broker", "bg-sky-500"],
          ["Producer", "bg-orange-500"],
          ["Consumer", "bg-emerald-500"],
          ["Topic", "bg-indigo-500"],
          ["Partition", "bg-slate-400"],
          ["Status", "bg-teal-500"],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
        <span className="ml-auto hidden text-[10px] text-slate-400 sm:block">
          Select and drag nodes · Scroll to zoom · Drag canvas to pan
        </span>
      </footer>
    </section>
  );
}
