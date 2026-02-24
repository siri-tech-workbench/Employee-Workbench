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

/* ----------------------------------------------------------
   STATIC DEMO DATA (Replace with API later)
---------------------------------------------------------- */
const employeeRows = [
  { name: "Development" },
  { name: "Shesha chandrika Vyasarajapura" },
  { name: "Jashwanth" },
  { name: "Prajwal Jamkandi" },
];

/**
 * GeneralNotificationForm Component
 *
 * Handles:
 * - Notification message input
 * - Target selection (All / Team / Employee)
 * - Preview list
 * - Send and Clear actions
 *
 * Currently uses static demo data.
 */
export default function GeneralNotificationForm() {
  return (
    <>
      <Box >
        <Grid container spacing={2}>
          {/* ================= LEFT SECTION ================= */}
          <Grid size={{ xs: 12, sm: 12, md: 5 }}>
            <Paper sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                {/* Notification Text */}
                <Grid size={{ xs: 12, md: 12 }}>
                  <TextField
                    label="Notification"
                    size="small"
                    multiline
                    rows={5}
                    fullWidth
                    required
                  />
                </Grid>

                {/* Send To Option */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    options={[
                      "All Employee",
                      "Logined Employee",
                      "Select Employee",
                      "Select Team",
                    ]}
                    renderInput={(params) => (
                      <TextField {...params} label="Send To" />
                    )}
                  />
                </Grid>

                {/* Select Employee / Team */}
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
                      <TextField {...params} label="Select Employee / Team" />
                    )}
                  />
                </Grid>

                {/* Add Button */}
                <Grid size={{ xs: 12, md: 2 }} textAlign="right">
                  <Button variant="contained" size="small" color="secondary">
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* ================= RIGHT SECTION ================= */}
          <Grid size={{ xs: 12, sm: 12, md: 7 }}>
            <Paper
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                background: (theme) =>
                  theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
                boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
              }}
            >
              <TableContainer sx={{ maxHeight: 350 }}>
                <Table size="small" stickyHeader>
                  {/* HEADER */}
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

                  {/* BODY */}
                  <TableBody>
                    {employeeRows.map((row, index) => (
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
                              theme.palette.mode === "dark"
                                ? "#33334a"
                                : "#e5e5e5",
                            cursor: "pointer",
                          },
                        })}
                      >
                        <TableCell>
                          <DeleteIcon
                            sx={{
                              color: "red",
                              cursor: "pointer",
                              fontSize: 22,
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ fontWeight: 700 }}>
                          {row.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Footer Actions */}
              <Box sx={{ mt: 1, textAlign: "right", p: 1 }}>
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
      </Box>
    </>
  );
}
