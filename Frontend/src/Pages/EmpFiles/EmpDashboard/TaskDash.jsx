import { useState } from "react";
import { Paper, Typography, Box, Tabs, Tab } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ToDoList from "./TaskDashFiles/ToDoList";
import Mytask from "./TaskDashFiles/Mytask";

export default function TaskDash() {
  // Tracks the active tab index: 0 = To Do List, 1 = My Task, 2 = Re Works
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Paper
      sx={{
        p: 0,
        height: "490px",
        overflow: "hidden",
        borderRadius: "14px",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#2a2d3a" : "#fff",
        color: (theme) => theme.palette.text.primary,
        transition: "0.3s ease",
        border: "2px solid #6F60C1",
      }}
    >
      {/* Panel header — matches NotificationDash header style */}
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
          <AssignmentIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>

        <Typography variant="h6" fontWeight={600} sx={{ color: "#fff" }}>
          Tasks
        </Typography>
      </Box>

      {/* Tab navigation */}
      <Box sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 42,
            "& .MuiTab-root": {
              fontWeight: 600,
              minHeight: 42,
              width: "33.33%",
            },
          }}
        >
          <Tab label="To Do List" />
          <Tab label="My Task" />
          <Tab label="Re Works" />
        </Tabs>
      </Box>

      {/* Tab panel content */}
      <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
        {activeTab === 0 && <ToDoList />}

        {activeTab === 1 && <Mytask />}

        {activeTab === 2 && (
          <Box>
            <Typography fontWeight={600}>Re Works</Typography>
            <Typography mt={1} fontSize={13} color="text.secondary">
              Re-work or returned tasks...
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
