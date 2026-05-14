import type { CampaignKPI } from "@shared/types";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

const colors = ["#1E1B4B", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444", "#334155", "#0F766E"];

export function BudgetChart({ campaigns, metric = "spend" }: { campaigns: CampaignKPI[]; metric?: "spend" | "revenue" }) {
  const data = campaigns.slice(0, 7).map((campaign) => ({ name: campaign.campaignName, value: campaign[metric] }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{metric === "spend" ? "Budget allocation" : "Revenue contribution"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
