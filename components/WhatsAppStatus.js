import useSWR from 'swr'
import { Box, Chip, Typography } from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import QrCode2Icon from '@mui/icons-material/QrCode2'

async function fetchQr(url) {
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) return null
  return res.json()
}

export default function WhatsAppStatus() {
  const { data } = useSWR('/api/whatsapp-qr', fetchQr, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  })

  if (data?.qr) {
    return (
      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <QrCode2Icon color="warning" />
          <Typography variant="subtitle2" color="warning.main">
            WhatsApp aguardando autenticação
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Escaneie o QR code abaixo com o WhatsApp no celular.
        </Typography>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.qr} alt="QR Code WhatsApp" style={{ width: 200, height: 200 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Chip
        icon={<CheckCircleOutlineIcon />}
        label="WhatsApp conectado"
        color="success"
        variant="outlined"
        size="small"
      />
    </Box>
  )
}
