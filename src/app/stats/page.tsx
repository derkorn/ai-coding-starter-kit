import Link from "next/link"
import { getDeviceStats, getStatistics } from "@/lib/actions/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function StatsPage() {
  const [deviceStats, stats] = await Promise.all([
    getDeviceStats(),
    getStatistics(),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
        <p className="mt-1 text-muted-foreground">
          Übersicht über Gerätenutzung und Ausleihvorgänge.
        </p>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{deviceStats.total}</p>
            <p className="mt-1 text-sm text-muted-foreground">Geräte gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-orange-600">{deviceStats.loaned}</p>
            <p className="mt-1 text-sm text-muted-foreground">Aktuell ausgeliehen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-emerald-600">{deviceStats.available}</p>
            <p className="mt-1 text-sm text-muted-foreground">Aktuell verfügbar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{stats.totalLoans}</p>
            <p className="mt-1 text-sm text-muted-foreground">Ausleihen gesamt</p>
          </CardContent>
        </Card>
      </div>

      {/* Längste aktive Ausleihen */}
      <Card>
        <CardHeader>
          <CardTitle>Längste aktive Ausleihen</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.longestActiveLoans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aktuell sind keine Geräte ausgeliehen.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gerät</TableHead>
                  <TableHead>Ausleiher</TableHead>
                  <TableHead>Klasse</TableHead>
                  <TableHead>Ausgabe</TableHead>
                  <TableHead className="text-right">Tage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.longestActiveLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Link
                        href={`/devices/${loan.deviceId}`}
                        className="font-medium hover:underline"
                      >
                        {loan.deviceName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {loan.borrowerFirstName} {loan.borrowerLastName}
                    </TableCell>
                    <TableCell>{loan.borrowerClass}</TableCell>
                    <TableCell>
                      {new Date(loan.loanedAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {loan.daysLoaned} Tage
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Häufigste Ausleiher */}
      <Card>
        <CardHeader>
          <CardTitle>Häufigste Ausleiher (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topBorrowers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Noch keine Ausleihvorgänge vorhanden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Klasse</TableHead>
                  <TableHead className="text-right">Ausleihen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topBorrowers.map((b, i) => (
                  <TableRow key={`${b.lastName}|${b.firstName}|${b.cls}`}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">
                      {b.firstName} {b.lastName}
                    </TableCell>
                    <TableCell>{b.cls}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{b.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Geräteauslastung */}
      <Card>
        <CardHeader>
          <CardTitle>Geräteauslastung (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.deviceUtilization.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Noch keine Ausleihvorgänge vorhanden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gerät</TableHead>
                  <TableHead className="text-right">Ausleihen</TableHead>
                  <TableHead className="text-right">Tage gesamt</TableHead>
                  <TableHead className="text-right">Ø Tage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.deviceUtilization.map((d) => (
                  <TableRow key={d.deviceId}>
                    <TableCell>
                      <Link
                        href={`/devices/${d.deviceId}`}
                        className="font-medium hover:underline"
                      >
                        {d.name}
                      </Link>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {d.serial}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{d.loanCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {d.totalDays}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {d.avgDays}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
