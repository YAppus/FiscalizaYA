import { Alert, Divider, Drawer, Stack, Typography } from "@mui/material";

import { TxStatusBadge } from "../../shared/components/TxStatusBadge";
import type { HistoryEntry, Occurrence } from "./types";


type OccurrenceHistoryProps = {
  open: boolean;
  occurrence: Occurrence | null;
  onClose: () => void;
};


export function OccurrenceHistory({ open, occurrence, onClose }: OccurrenceHistoryProps) {
  const history = [...(occurrence?.history_entries ?? [])].sort((a, b) => Date.parse(b.changed_at) - Date.parse(a.changed_at));

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Stack sx={{ width: { xs: "100vw", sm: 440 }, p: 3, gap: 2 }}>
        <Typography variant="h5">Historico da ocorrencia</Typography>
        <Typography color="text.secondary">Registro #{occurrence?.id ?? "-"}</Typography>
        {history.length === 0 ? (
          <Alert severity="info">Nenhuma mudanca de status registrada.</Alert>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={2}>
            {history.map((item) => (
              <HistoryTimelineItem key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}


function HistoryTimelineItem({ item }: { item: HistoryEntry }) {
  return (
    <Stack spacing={1.25}>
      <Typography variant="body2" color="text.secondary">
        {new Date(item.changed_at).toLocaleString("pt-BR")}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
        {item.previous_status ? <TxStatusBadge status={item.previous_status} /> : <Typography variant="body2">Criacao</Typography>}
        <Typography variant="body2">para</Typography>
        <TxStatusBadge status={item.new_status} />
      </Stack>
      {item.note ? <Typography variant="body2">{item.note}</Typography> : null}
    </Stack>
  );
}
