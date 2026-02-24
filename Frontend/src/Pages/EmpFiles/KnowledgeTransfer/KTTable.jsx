import { useState, useEffect } from "react";
import {
  Autocomplete,
  Button,
  Grid,
  Paper,
  TableContainer,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import dayjs from "dayjs";
import { getKT, getKT_emp_DD, downloadKT } from "../../../Services/KT.services";

export default function KTTable({ refreshKey }) {
  const [ktRows, setKtRows] = useState([]);
  const [empDD, setEmpDD] = useState([]);
  const [form, setForm] = useState({ presenter: null, topic: "" });

  // Fetch all KT records, optionally filtered by search params
  const fetchKTData = async (params = {}) => {
    try {
      const res = await getKT(params);
      setKtRows(Array.isArray(res?.items) ? res.items : []);
    } catch (error) {
      console.error("Failed to fetch KT data:", error);
      setKtRows([]);
    }
  };

  // Fetch employee dropdown options for the presenter filter
  const fetchEmpDD = async () => {
    try {
      const res = await getKT_emp_DD();
      setEmpDD(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error("Failed to fetch employee dropdown:", err);
      setEmpDD([]);
    }
  };

  // Reload table and dropdown whenever the parent signals a new submission
  useEffect(() => {
    fetchKTData();
    fetchEmpDD();
  }, [refreshKey]);

  // Build search params from non-empty filter fields and re-fetch
  const handleSearch = async () => {
    const params = {};
    if (form.presenter?.emp_id) params.emp_id = form.presenter.emp_id;
    if (form.topic?.trim()) params.topic = form.topic.trim();
    fetchKTData(params);
  };

  // Reset filters and reload the full unfiltered list
  const handleClear = (e) => {
    e.preventDefault();
    setForm({ presenter: null, topic: "" });
    fetchKTData();
  };

  /**
   * Downloads the KT PDF for a given employee ID.
   * Creates a temporary anchor element to trigger the browser download,
   * then immediately cleans up the object URL to avoid memory leaks.
   */
  const handleDownload = async (empId) => {
    try {
      const blob = await downloadKT(empId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Knowledge.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      {/* Search filter bar */}
      <Grid container spacing={2} component={Paper} p={2}>
        {/* Topic keyword filter */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            label="Topic"
            size="small"
            fullWidth
            value={form.topic}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, topic: e.target.value }))
            }
          />
        </Grid>

        {/* Presenter filter */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Autocomplete
            options={empDD}
            value={form.presenter}
            size="small"
            fullWidth
            getOptionLabel={(option) => option?.name || ""}
            isOptionEqualToValue={(option, value) =>
              option?.emp_id === value?.emp_id
            }
            onChange={(_, value) =>
              setForm((prev) => ({ ...prev, presenter: value }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Presenter" size="small" />
            )}
          />
        </Grid>

        {/* Search and clear actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Button variant="contained" size="small" onClick={handleSearch}>
            Search
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={handleClear}
            sx={{ ml: 1 }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>

      {/* KT records table */}
      <Paper
        sx={{
          borderRadius: "10px",
          mt: 3,
          overflow: "auto",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#1e1e2f" : "#ffffff",
        }}
      >
        <TableContainer sx={{ height: 318 }}>
          <Table size="small" stickyHeader>
            {/* Table header */}
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#2c2c3d" : "#2a0202ff",
                  "& th": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",
                    fontWeight: 600,
                  },
                }}
              >
                <TableCell>Date</TableCell>
                <TableCell>Presenter</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Brief Description</TableCell>
                <TableCell align="center">Download</TableCell>
              </TableRow>
            </TableHead>

            {/* KT record rows */}
            <TableBody>
              {ktRows.map((row) => (
                <TableRow key={row.K_ID}>
                  <TableCell
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dayjs(row.K_DATE).format("DD-MMM-YYYY")}
                  </TableCell>
                  <TableCell
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.k_topic}
                  </TableCell>
                  <TableCell
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.k_description}
                  </TableCell>

                  {/* Download PDF or show placeholder when no file exists */}
                  <TableCell align="center">
                    {row.k_file_name ? (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownload(row.emp_id)}
                      >
                        <FileDownloadIcon />
                      </IconButton>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No File
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
