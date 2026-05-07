import { ExternalLink, ShoppingBag } from "lucide-react";

import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { formatCurrency } from "../../../../utils/formatters";
import { PerformanceEmptyState } from "./PerformanceEmptyState";
import { WhatsAppAttributedOrder, WhatsAppClickedProduct, WhatsAppProviderDataMode } from "./performanceTypes";

export interface TopClickedProductsTableProps {
  products: WhatsAppClickedProduct[];
  providerMode?: WhatsAppProviderDataMode;
  onProductSelect?: (product: WhatsAppClickedProduct) => void;
}

export interface AttributedOrdersTableProps {
  orders: WhatsAppAttributedOrder[];
  providerMode?: WhatsAppProviderDataMode;
  onOrderSelect?: (order: WhatsAppAttributedOrder) => void;
}

const formatRate = (value?: number) => (typeof value === "number" ? `${value.toFixed(1)}%` : "Pending");

export const TopClickedProductsTable = ({
  products,
  providerMode = "provisional",
  onProductSelect,
}: TopClickedProductsTableProps): JSX.Element => (
  <Card className="border-0 bg-white shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Top clicked products</h3>
          <p className="mt-1 text-sm text-slate-500">Product interest from tracked WhatsApp campaign links.</p>
        </div>
        {providerMode !== "live" ? <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Placeholder</Badge> : null}
      </div>

      {products.length === 0 ? (
        <div className="mt-5">
          <PerformanceEmptyState
            title="No clicked products yet"
            description="This table is ready for redirect-click data. In mock provider mode, keep it visible as a placeholder for product-level engagement."
          />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="py-3 pr-4 font-semibold">Clicks</th>
                <th className="py-3 pr-4 font-semibold">Unique clickers</th>
                <th className="py-3 pr-4 font-semibold">Orders</th>
                <th className="py-3 pr-4 font-semibold">CTR</th>
                <th className="py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => onProductSelect?.(product)}
                  className={`border-b border-slate-50 last:border-0 ${onProductSelect ? "cursor-pointer hover:bg-blue-50/60" : ""}`}
                >
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-slate-950">{product.productName}</p>
                    <p className="text-xs text-slate-500">{product.category || "Campaign product"}</p>
                  </td>
                  <td className="py-4 pr-4 font-semibold text-slate-800">{product.clicks.toLocaleString("en-US")}</td>
                  <td className="py-4 pr-4 text-slate-600">{(product.uniqueClickers ?? product.clicks).toLocaleString("en-US")}</td>
                  <td className="py-4 pr-4 text-slate-600">{(product.orders ?? 0).toLocaleString("en-US")}</td>
                  <td className="py-4 pr-4 text-slate-600">{formatRate(product.clickThroughRate)}</td>
                  <td className="py-4 font-semibold text-emerald-700">{formatCurrency(product.revenue ?? 0, "PKR", 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

export const AttributedOrdersTable = ({
  orders,
  providerMode = "provisional",
  onOrderSelect,
}: AttributedOrdersTableProps): JSX.Element => (
  <Card className="border-0 bg-white shadow-sm">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Orders generated</h3>
          <p className="mt-1 text-sm text-slate-500">Click-through orders attributed within the campaign window.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <ShoppingBag className="h-5 w-5" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-5">
          <PerformanceEmptyState
            title={providerMode === "mock" ? "Order attribution is mocked" : "No attributed orders yet"}
            description="Orders will appear when a customer clicks a tracked campaign link and purchases inside the attribution window."
          />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4 font-semibold">Order</th>
                <th className="py-3 pr-4 font-semibold">Customer</th>
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="py-3 pr-4 font-semibold">Attribution</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => onOrderSelect?.(order)}
                  className={`border-b border-slate-50 last:border-0 ${onOrderSelect ? "cursor-pointer hover:bg-emerald-50/60" : ""}`}
                >
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-950">{order.orderNumber || order.id}</span>
                      {onOrderSelect ? <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> : null}
                    </div>
                    <p className="text-xs text-slate-500">{order.orderDate || "Date pending"}</p>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{order.customerName || "Customer pending"}</td>
                  <td className="py-4 pr-4 text-slate-600">{order.productName || "Mixed order"}</td>
                  <td className="py-4 pr-4">
                    <Badge variant="outline" className="capitalize text-slate-700">
                      {order.attributionType || "click-through"}
                    </Badge>
                  </td>
                  <td className="py-4 pr-4 text-slate-600">{order.status || "Attributed"}</td>
                  <td className="py-4 font-semibold text-emerald-700">{formatCurrency(order.revenue, "PKR", 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);
