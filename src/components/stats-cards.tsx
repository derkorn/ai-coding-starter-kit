import { Card, CardContent } from "@/components/ui/card"

interface StatsCardsProps {
  total: number
  available: number
  loaned: number
}

export function StatsCards({ total, available, loaned }: StatsCardsProps) {
  const stats = [
    { label: "Gesamt", value: total, color: "text-foreground" },
    { label: "Verfügbar", value: available, color: "text-emerald-600" },
    { label: "Ausgeliehen", value: loaned, color: "text-orange-600" },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
