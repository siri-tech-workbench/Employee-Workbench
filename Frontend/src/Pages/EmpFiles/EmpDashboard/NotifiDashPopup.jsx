import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Divider,
} from "@mui/material";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";

export default function NotifiDashPopup({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "14px",
            overflow: "hidden",
            mt: -20,
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Dialog header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            background: "linear-gradient(135deg, #6F60C1, #8578e6)",
            color: "#fff",
          }}
        >
          {/* Icon badge */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MarkEmailUnreadIcon />
          </Box>

          <Typography fontSize={16} fontWeight={600}>
            New Message Received
          </Typography>
        </Box>

        {/* Dialog body */}
        <Box sx={{ p: 2.5 }}>
          {/* Sender and recipient summary */}
          <Typography fontSize={15} mb={1.5}>
            <b style={{ color: "#6F60C1" }}>SRINATH</b> has sent a new message
            to <b style={{ color: "#6F60C1" }}>SIRI</b>
          </Typography>

          {/* Message content block with left accent border */}
          <Box
            sx={{
              border: "1px solid #6F60C1",
              borderLeft: "5px solid #6F60C1",
              px: 2,
              py: 1.2,
              mb: 2,
              borderRadius: "6px",
            }}
          >
            <Typography fontSize={14.5}>
              <b>Message:</b> testing message
            </Typography>
          </Box>

          {/* Metadata grid: received time, date, notification type */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              rowGap: 1.5,
              columnGap: 2,
              mb: 3,
            }}
          >
            <Typography fontSize={14}>
              <b>Received At:</b> 10:45 AM
            </Typography>

            <Typography fontSize={14}>
              <b>Date:</b> 21-Nov-2025
            </Typography>

            <Typography fontSize={14}>
              <b>Type:</b>{" "}
              <span style={{ color: "#1976d2", fontWeight: 600 }}>GENERAL</span>
            </Typography>
          </Box>

          <Divider />

          {/* Close action */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                px: 4,
                borderRadius: "20px",
                backgroundColor: "#6F60C1",
                textTransform: "uppercase",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#5b4fc7" },
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
