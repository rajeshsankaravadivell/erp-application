import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireRole(["Admin", "StoreManager"]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button>+ New Pitch</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">12</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">9</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pitches</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">18</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">72%</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deals</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">2</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Active Deals</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded">Lena Harper - $125</div>
              <div className="p-3 border rounded">Sophie Kim - $95</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Tasks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded">Invoice for Notion</div>
              <div className="p-3 border rounded">Tik Tok reels</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
