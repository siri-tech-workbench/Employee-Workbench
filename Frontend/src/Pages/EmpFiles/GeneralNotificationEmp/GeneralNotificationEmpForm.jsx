import { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Static placeholder rows — replace with state populated from API
const EMPLOYEE_ROWS = [
  { type: "Development" },
  { type: "Shesha chandrika Vyasarajapura" },
  { type: "Jashwanth" },
  { type: "Prajwal Jamkandi" },
];

export default function GeneralNotificationEmpForm() {
  return (
    <Grid container spacing={2}>
      {/* Left panel: notification compose form */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Grid container spacing={2} mb={2} component={Paper} p={2.5}>
          {/* Notification message input */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notification"
              multiline
              fullWidth
              required
              rows={5}
              size="small"
            />
          </Grid>

          {/* Recipient scope selector */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={[
                "All Employee",
                "Logined Employee",
                "Select Employee",
                "Select Team",
              ]}
              renderInput={(params) => (
                <TextField {...params} label="Send To" size="small" />
              )}
            />
          </Grid>

          {/* Specific employee or team selector */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={[
                "Design",
                "Development",
                "Testing",
                "Marketing",
                "Employee 1",
                "Employee 2",
                "Employee 3",
                "Employee 4",
              ]}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Employee / Team"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Add recipient to the list */}
          <Grid size={{ xs: 12 }} textAlign="right">
            <Button variant="contained" size="small" color="secondary">
              Add
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* Right panel: recipient list table + send/clear actions */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
          }}
        >
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              {/* Table header */}
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell>Action</TableCell>
                  <TableCell>Employee / Team Name</TableCell>
                </TableRow>
              </TableHead>

              {/* Recipient rows — alternating blue/pink for light, dark variants */}
              <TableBody>
                {EMPLOYEE_ROWS.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={(theme) => ({
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.mode === "dark"
                            ? "#1f1f2b"
                            : "#e8f4ff"
                          : theme.palette.mode === "dark"
                            ? "#29293a"
                            : "#ffe6eb",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                        cursor: "pointer",
                      },
                    })}
                  >
                    {/* Delete recipient */}
                    <TableCell>
                      <DeleteIcon
                        sx={{ color: "red", cursor: "pointer", fontSize: 22 }}
                      />
                    </TableCell>

                    {/* Recipient name */}
                    <TableCell sx={{ fontWeight: 700 }}>{row.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Send and clear actions */}
          <Box sx={{ mt: 1, textAlign: "right", p: 2 }}>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              sx={{ mr: 1 }}
            >
              Send
            </Button>
            <Button variant="contained" size="small" color="warning">
              Clear
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
