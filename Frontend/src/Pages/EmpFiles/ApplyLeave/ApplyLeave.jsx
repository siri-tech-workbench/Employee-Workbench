import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import React from "react";
import {
  getemployeeleavedetails,
  getemployeeleavecards,
  getlopdayscount,
} from "../../../Services/leave.services";
import ApplyLeavePopup from "./ApplyLeavePopup";

// ---------------------------------------------------------------------------
// Leave status code to label map — matches the backend enum
// ---------------------------------------------------------------------------
const LEAVE_STATUS_MAP = {
  1: "APPROVED",
  2: "REJECTED",
};

// ---------------------------------------------------------------------------
// Default LOP (Loss of Pay) data shape used on mount and fetch failure
// ---------------------------------------------------------------------------
const defaultLopData = { CL: 0, ML: 0, EL: 0, TOTAL: 0 };

/**
 * Formats a raw date value into a human-readable DD-Mon-YYYY string.
 * Returns "-" if the input is null, undefined, or empty.
 *
 * @param {string|Date|null} date - The raw date value from the API.
 * @returns {string} Formatted date string or "-".
 */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Resolves a numeric leave status code to its readable label.
 * Defaults to "PENDING" for any code not in LEAVE_STATUS_MAP.
 *
 * @param {number} status - Numeric status code from the API.
 * @returns {string} Human-readable status label.
 */
const getStatusText = (status) => LEAVE_STATUS_MAP[status] || "PENDING";

/**
 * Returns the appropriate MUI icon component for a given leave type name.
 * Falls back to WorkspacePremiumIcon for unrecognised leave types.
 *
 * @param {string} leaveName - Leave type name string from the API.
 * @returns {JSX.Element} MUI icon element.
 */
const getLeaveIcon = (leaveName = "") => {
  const key = leaveName.trim().toUpperCase();

  switch (key) {
    case "MEDICAL LEAVE":
      return <MedicalServicesIcon />;
    case "CASUAL LEAVE":
      return <BeachAccessIcon />;
    case "EARNED LEAVE":
      return <WorkspacePremiumIcon />;
    case "COMP-OFF LEAVE":
      return <AccessTimeIcon />;
    default:
      return <WorkspacePremiumIcon />;
  }
};

/**
 * Shared MUI sx style for leave summary cards.
 * Applies border, shadow, hover lift, and theme-aware background.
 *
 * @param {import("@mui/material").Theme} theme - The active MUI theme.
 * @returns {object} MUI sx style object.
 */
const leaveCardSx = (theme) => ({
  display: "flex",
  alignItems: "center",
  height: 110,
  borderRadius: "14px",
  overflow: "hidden",
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[900]
      : theme.palette.background.paper,
  border: "2px solid #6F60C1",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 2px 8px rgba(0,0,0,0.5)"
      : "0 4px 12px rgba(0,0,0,0.15)",
  transition: "0.25s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 4px 14px rgba(0,0,0,0.7)"
        : "0 6px 16px rgba(0,0,0,0.2)",
  },
});

/** Shared sx style for the colored icon strip on the left of each leave card */
const cardIconStripSx = {
  width: 50,
  height: "100%",
  backgroundColor: "#6F60C1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/**
 * ApplyLeave
 *
 * Dashboard page for employee leave management.
 * Renders:
 *  - Leave summary cards (one per leave type + a fixed LOP days card)
 *  - Apply Leave button that opens the ApplyLeavePopup dialog
 *  - Leave history table showing all past and pending leave requests
 *
 * Fetches leave cards, leave history, and LOP days count on mount.
 * Refreshes leave cards and history after a successful leave application.
 */
export default function ApplyLeave() {
  // Leave type summary cards fetched from the API
  const [leaveCards, setLeaveCards] = useState([]);

  // Loss of Pay day counts broken down by leave type
  const [lopData, setLopData] = useState(defaultLopData);

  // Leave request history rows shown in the table
  const [leaveHistory, setLeaveHistory] = useState([]);

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchLeaveHistory();
    fetchLeaveCards();
    fetchLopDays();
  }, []);

  // -------------------------------------------------------------------------
  // Data fetching functions
  // -------------------------------------------------------------------------

  /**
   * Fetches the employee's leave request history and maps API fields
   * to display-ready labels and formatted dates.
   */
  const fetchLeaveHistory = async () => {
    try {
      const list = await getemployeeleavedetails();

      const mappedData = list.map((item) => ({
        type: item.LEAVE_NAME,
        status: getStatusText(item.STATUS),
        no_of_days: item.NO_OF_DAYS,
        from: formatDate(item.REQ_LEAVE_FROM),
        to: formatDate(item.REQ_LEAVE_TO),
        approvedFrom: formatDate(item.APPROVED_FROM),
        approvedTo: formatDate(item.APPROVED_TO),
      }));

      setLeaveHistory(mappedData);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      setLeaveHistory([]);
    }
  };

  /**
   * Fetches leave balance summary cards for each leave type
   * and resolves the appropriate icon for each card.
   */
  const fetchLeaveCards = async () => {
    try {
      const data = await getemployeeleavecards();

      const mappedCards = data.map((item) => ({
        title: item.LEAVE_NAME,
        balance: item.BAL_LEAVE,
        allotted: item.ALLOTED,
        used: item.USED_LEAVE,
        expired: item.EXP_COMPOFF,
        carryForward: item.CARRY_FORWARD,
        icon: getLeaveIcon(item.LEAVE_NAME),
      }));

      setLeaveCards(mappedCards);
    } catch (error) {
      console.error("Error fetching leave cards", error);
    }
  };

  /**
   * Fetches LOP (Loss of Pay) day counts and maps them by leave type name
   * into the CL / ML / EL structure used by the LOP summary card.
   */
  const fetchLopDays = async () => {
    try {
      const data = await getlopdayscount();

      let cl = 0,
        ml = 0,
        el = 0;

      data.forEach((row) => {
        const name = row.LEAVE_NAME.toUpperCase();
        if (name.includes("CASUAL")) cl = row.LOP_DAYS;
        else if (name.includes("MEDICAL")) ml = row.LOP_DAYS;
        else if (name.includes("EARNED")) el = row.LOP_DAYS;
      });

      setLopData({ CL: cl, ML: ml, EL: el, TOTAL: cl + ml + el });
    } catch (error) {
      console.error("Error fetching LOP days", error);
    }
  };

  return (
    <Box>
      {/* Leave summary cards row */}
      <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
        {leaveCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 2.4 }} key={card.title}>
            <Paper sx={(theme) => leaveCardSx(theme)}>
              {/* Colored icon strip — left side of each card */}
              <Box sx={cardIconStripSx}>
                {React.cloneElement(card.icon, {
                  sx: { fontSize: 34, color: "#fff" },
                })}
              </Box>

              {/* Card content — layout differs for comp-off vs normal leaves */}
              <Box sx={{ px: 1.8, py: 1.2, flex: 1 }}>
                <Typography fontSize={12} fontWeight={700} mb={0.6}>
                  {card.title}
                </Typography>

                <Grid container spacing={1}>
                  {card.title === "COMP-OFF LEAVE" ? (
                    /* Comp-off card — shows Earned, Used, Balance, Expired */
                    <>
                      <Grid size={6}>
                        <Typography fontSize={12} fontWeight={700}>
                          Earned : {card.allotted}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography fontSize={12} fontWeight={700}>
                          Used : {card.used}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography fontSize={12} sx={{ color: "#6F60C1" }}>
                          Rem Bal : {card.balance}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography fontSize={12} sx={{ color: "red" }}>
                          Expired : {card.expired ?? 0}
                        </Typography>
                      </Grid>
                    </>
                  ) : (
                    /* Normal leave card — shows Used, Allotted, Balance, C/F for Earned Leave only */
                    <>
                      <Grid size={6}>
                        <Typography fontSize={12} fontWeight={700}>
                          Used : {card.used}
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography fontSize={12} fontWeight={700}>
                          Alted : {card.allotted}
                        </Typography>
                      </Grid>
                      {card.title === "EARNED LEAVE" && (
                        <Grid size={6}>
                          <Typography fontSize={12} fontWeight={700}>
                            C/F : {card.carryForward ?? 0}
                          </Typography>
                        </Grid>
                      )}
                      <Grid size={6}>
                        <Typography fontSize={12} sx={{ color: "#6F60C1" }}>
                          Rem Bal : {card.balance}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Grid>
        ))}

        {/* Fixed LOP (Loss of Pay) summary card */}
        <Grid size={{ xs: 12, sm: 2.4 }}>
          <Paper sx={(theme) => leaveCardSx(theme)}>
            <Box sx={cardIconStripSx}>
              <MoneyOffIcon sx={{ fontSize: 34, color: "#fff" }} />
            </Box>

            <Box sx={{ px: 1.8, py: 1.2, flex: 1 }}>
              <Grid container spacing={1}>
                <Grid size={12}>
                  <Typography fontSize={12} fontWeight={700}>
                    LOP Days
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography fontSize={12}>CL : {lopData.CL}</Typography>
                </Grid>
                <Grid size={4}>
                  <Typography fontSize={12}>ML : {lopData.ML}</Typography>
                </Grid>
                <Grid size={4}>
                  <Typography fontSize={12}>EL : {lopData.EL}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography
                    fontSize={14}
                    fontWeight={700}
                    sx={{ color: "#6F60C1", mt: 0.5 }}
                  >
                    Total : {lopData.TOTAL}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Apply Leave button — opens the apply leave dialog */}
        <Grid size={{ xs: 12, sm: 3 , md: 3}} mt={3}>
          <ApplyLeavePopup
            onSuccess={() => {
              fetchLeaveCards();
              fetchLeaveHistory();
            }}
          />
        </Grid>
      </Grid>

      {/* Leave history table — shows all past and pending leave requests */}
      <TableContainer
        component={Paper}
        sx={(theme) => ({
          borderRadius: 3,
          overflow: "auto",
          maxHeight: 400,
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          backgroundColor:
            theme.palette.mode === "dark" ? theme.palette.grey[900] : "#ffffff",
          transition: "0.3s ease",
        })}
      >
        <Table stickyHeader>
          {/* Table header — bold column labels */}
          <TableHead>
            <TableRow
              sx={(theme) => ({
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[800]
                    : "#E9ECEF",
              })}
            >
              <TableCell sx={{ fontWeight: 700 }}>Leave Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Leave Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>No of Days</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Request Leave From</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Request Leave To</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Approved From</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Approved To</TableCell>
            </TableRow>
          </TableHead>

          {/* Table body — alternating row colors with hover highlight */}
          <TableBody>
            {leaveHistory.map((row, i) => (
              <TableRow
                key={i}
                sx={(theme) => ({
                  backgroundColor:
                    i % 2 === 0
                      ? theme.palette.mode === "dark"
                        ? theme.palette.grey[900]
                        : "#F8F9FA"
                      : theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : "#FFFFFF",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? theme.palette.action.hover
                        : "#E3F2FD",
                  },
                })}
              >
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.no_of_days}</TableCell>
                <TableCell>{row.from}</TableCell>
                <TableCell>{row.to}</TableCell>
                <TableCell>{row.approvedFrom}</TableCell>
                <TableCell>{row.approvedTo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
