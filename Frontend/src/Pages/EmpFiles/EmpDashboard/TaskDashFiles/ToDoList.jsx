import { Box, Paper, Typography, Button, Divider } from "@mui/material";

const tasks = [
  {
    title: "New task to akash",
    assignedBy: "ANURAAG",
    dueDate: "04/Nov/2024",
  },
  {
    title: "attendance , late hour entry , leave details entry",
    assignedBy: "ANURAAG",
    dueDate: "22/Feb/2025",
  },
  {
    title: "flow checking 6",
    assignedBy: "ANURAAG",
    dueDate: "11/Nov/2024",
  },
];

export default function ToDoList() {
  return (
    <>
      <Box sx={{ height: "360px", overflowY: "auto", pb: 7 }}>
        {tasks.map((task, index) => (
          <Paper
            key={index}
            sx={{
              mb: 2,
              mr: 1,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {/* Card content with left accent border */}
            <Box
              sx={{
                p: 2,
                flex: 1,
                borderLeft: "5px solid #1976d2",
                border: "1px solid #1976d2",
                borderRadius: "10px",
              }}
            >
              <>
                {/* Task title */}
                <Typography fontSize={15} fontWeight={600}>
                  {task.title}
                </Typography>

                <Divider sx={{ my: 1 }} />

                {/* Assigned by + action buttons row */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Assigned by info */}
                  <>
                    <Box>
                      <Typography fontSize={12} color="text.secondary">
                        Assigned By
                      </Typography>
                      <Typography fontSize={13} fontWeight={500}>
                        {task.assignedBy}
                      </Typography>
                    </Box>
                  </>

                  {/* Action buttons */}
                  <>
                    <Box textAlign="right">
                      <Button
                        size="small"
                        sx={{
                          px: 2,
                          borderRadius: "20px",
                          fontSize: 11,
                          border: "1px solid #1976d2",
                          color: "#1976d2",
                        }}
                      >
                        PLAN
                      </Button>

                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          px: 2.5,
                          borderRadius: "20px",
                          fontSize: 11,
                          ml: 1,
                          textTransform: "none",
                        }}
                      >
                        EXECUTION
                      </Button>
                    </Box>
                  </>
                </Box>
              </>
            </Box>
          </Paper>
        ))}
      </Box>
    </>
  );
}
