import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import { getHolidayListTable } from "../../../Services/HolidayList.services";

export default function HolidayList() {
  const [holiday, setHoliday] = useState([]);

  // Fetch holiday list for the current year on mount
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await getHolidayListTable();
        setHoliday(res?.items ?? []);
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
        setHoliday([]);
      }
    };

    fetchHolidays();
  }, []);

  return (
    <Box>
      {/* Page heading */}
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12 }} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Holidays List
          </Typography>
        </Grid>
      </Grid>

      {/* Holiday table */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              borderRadius: 1,
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
                    <TableCell>Date</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Title</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {holiday.length === 0 ? (
                    // Empty state row
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No holidays found
                      </TableCell>
                    </TableRow>
                  ) : (
                    holiday.map((row) => (
                      <TableRow key={row.holiday_id}>
                        {/* Formatted date: DD/MM/YYYY */}
                        <TableCell sx={{ fontWeight: 600 }}>
                          {new Date(row.holiday_date).toLocaleDateString(
                            "en-GB",
                          )}
                        </TableCell>

                        {/* Full weekday name derived from the same date */}
                        <TableCell>
                          {new Date(row.holiday_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                            },
                          )}
                        </TableCell>

                        <TableCell sx={{ fontWeight: 600 }}>
                          {row.title}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
