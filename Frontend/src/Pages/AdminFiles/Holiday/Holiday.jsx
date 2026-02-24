import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";

import HolidayForm from "./HolidayForm";
import HolidayTable from "./HolidayTable";
import AddCalendar from "./AddCalendar";

import {
  getholidaylist,
  deleteholiday,
} from "../../../Services/holiday.service";

import {
  deleteErrorAlert,
  deleteAlert,
  showPostSuccess,
} from "../../../Components/swal_alert";

import Loading from "../../../Components/loading";

/**
 * Holiday Component
 *
 * Responsibilities:
 * - Fetch holiday list
 * - Handle edit selection
 * - Handle delete operation
 * - Render HolidayForm and HolidayTable
 */
export default function Holiday() {
  const [editRow, setEditRow] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------
     FETCH HOLIDAYS
  ---------------------------------------------------------- */
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await getholidaylist();
      setRows(res?.items || []);
    } catch (error) {
      console.error("Failed to load holidays", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ----------------------------------------------------------
     DELETE HANDLER
  ---------------------------------------------------------- */
  const handleDelete = async (row) => {
    const result = await deleteAlert(
      "Delete Holiday?",
      `Do you want to delete "${row.title}"?`,
    );

    if (!result?.isConfirmed) return;

    try {
      await deleteholiday(row.holiday_id);

      await showPostSuccess("Holiday deleted successfully");

      setRows((prev) => prev.filter((r) => r.holiday_id !== row.holiday_id));
    } catch (error) {
      console.error("Delete failed", error);
      await deleteErrorAlert();
    }
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <Box>
      {loading && <Loading />}

      {/* HEADER SECTION */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, md: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#28126dff">
            Holidays
          </Typography>
        </Grid>

        <Grid
          size={{ xs: 12, md: 12 }}
          component={Paper}
          p={2}
          textAlign="right"
        >
          <AddCalendar />
        </Grid>
      </Grid>

      {/* CONTENT SECTION */}
      <Grid container spacing={2}>
        {/* Holiday Form */}
        <Grid size={{ xs: 12, md: 10 }}>
          <HolidayForm
            editRow={editRow}
            setEditRow={setEditRow}
            setRows={setRows}
          />
        </Grid>

        {/* Holiday Table */}
        <Grid size={{ xs: 12, md: 12 }}>
          <HolidayTable
            onEdit={setEditRow}
            rows={rows}
            onDelete={handleDelete}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
