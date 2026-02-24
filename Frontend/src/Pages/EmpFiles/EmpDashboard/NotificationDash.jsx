import { useState } from "react";
import { Paper, Typography, Box } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotifiDashPopup from "./NotifiDashPopup";

// Static notification data — replace with API call when integrating backend
const notifications = [
  { message: "You have a new task from SRINATH", time: "02-Dec | 12:20 PM" },
  {
    message: "Your leave request has been approved",
    time: "01-Dec | 05:10 PM",
  },
  { message: "New rework assigned by ANURAAG", time: "01-Dec | 11:45 AM" },
  {
    message: "Permission request is pending approval",
    time: "30-Nov | 03:30 PM",
  },
  { message: "Task deadline updated by Manager", time: "29-Nov | 10:05 AM" },
  { message: "New task assigned to you by HR", time: "28-Nov | 04:15 PM" },
];

export default function NotificationDash() {
  const [openPopup, setOpenPopup] = useState(false);

  return (
    <>
      <Paper
        sx={{
          p: 0,
          height: "490px",
          overflow: "auto",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#2a2d3a" : "#fff",
          border: "2px solid #6F60C1",
          borderRadius: "14px",
        }}
      >
        {/* Panel header */}
        <Box
          sx={{
            px: 2,
            py: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            backgroundColor: "#6F60C1",
            borderRadius: "12px 12px 0 0",
          }}
        >
          {/* Icon badge */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NotificationsActiveIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>

          <Typography variant="h6" fontWeight={600} sx={{ color: "#fff" }}>
            General Notification
          </Typography>
        </Box>

        {/* Notification list */}
        <Box sx={{ p: 2 }}>
          {notifications.map((item, index) => (
            <Paper
              key={index}
              onClick={() => setOpenPopup(true)}
              sx={{
                mb: 1.5,
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: "10px",
                cursor: "pointer",
                border: "1px solid #6F60C1",
                borderLeft: "4px solid #6F60C1",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
                },
              }}
            >
              {/* Notification message */}
              <Typography fontSize={14} fontWeight={600}>
                {item.message}
              </Typography>

              {/* Timestamp */}
              <Typography
                fontSize={13}
                fontWeight={600}
                color="#6F60C1"
                sx={{ whiteSpace: "nowrap" }}
              >
                {item.time}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      {/* Notification detail popup */}
      <NotifiDashPopup open={openPopup} onClose={() => setOpenPopup(false)} />
    </>
  );
}
