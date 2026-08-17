import { requireRole } from "@/lib/auth/session";
import { listAuditLogs } from "@/lib/firestore/audit-log";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AuditLogPage() {
  await requireRole(["Admin"]);
  const entries = await listAuditLogs(100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>
          Immutable ledger of every Master Data change. Most recent {entries.length} entries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit log entries yet.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{entry.timestamp?.toDate().toLocaleString() ?? "—"}</TableCell>
                <TableCell>{entry.actorEmail}</TableCell>
                <TableCell className="capitalize">{entry.action}</TableCell>
                <TableCell className="font-mono text-xs">{entry.docPath}</TableCell>
                <TableCell>
                  <details>
                    <summary className="cursor-pointer text-primary underline-offset-4 hover:underline">
                      View
                    </summary>
                    <div className="mt-2 flex flex-col gap-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Before</p>
                        <pre className="max-w-md overflow-x-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(entry.before, null, 2) ?? "null"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">After</p>
                        <pre className="max-w-md overflow-x-auto rounded-md bg-muted p-2 text-xs">
                          {JSON.stringify(entry.after, null, 2) ?? "null"}
                        </pre>
                      </div>
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
