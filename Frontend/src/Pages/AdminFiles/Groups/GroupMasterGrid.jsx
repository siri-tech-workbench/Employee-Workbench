import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Paper, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getGroupMaster,
  deleteGroupMaster,
} from "../../../Services/GroupMaster.services";

import { deleteAlert, deleteErrorAlert } from "../../../Components/swal_alert";

/**
 * GroupMasterGrid Component
 *
 * Responsibilities:
 * - Fetch and display group list
 * - Handle edit action
 * - Handle delete action
 */
export default function GroupMasterGrid({ onEdit, refreshKey, refreshGrid }) {
  const [rows, setRows] = useState([]);

  /* ----------------------------------------------------------
     FETCH GRID DATA
  ---------------------------------------------------------- */
  const fetchGridData = async () => {
    try {
      const res = await getGroupMaster();
      setRows(res?.items || []);
    } catch (error) {
      console.error("Failed to fetch group data", error);
    }
  };

  useEffect(() => {
    fetchGridData();
  }, [refreshKey]);

  /* ----------------------------------------------------------
     EDIT HANDLER
  ---------------------------------------------------------- */
  const handleEdit = (row) => {
    onEdit(row);
  };

  /* ----------------------------------------------------------
     DELETE HANDLER
  ---------------------------------------------------------- */
  const handleDelete = async (row) => {
    try {
      const result = await deleteAlert(
        "Are you sure?",
        `Do you want to delete "${row.GROUP_NAME}"?`,
      );

      if (!result?.isConfirmed) return;

      const res = await deleteGroupMaster(row.GROUP_ID);

      if (res?.Status === 1) {
        refreshGrid();
      }
    } catch (error) {
      deleteErrorAlert("Failed to delete");
      console.error(error);
    }
  };

  /* ----------------------------------------------------------
     GRID COLUMNS
  ---------------------------------------------------------- */
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
    {
      field: "GROUP_NAME",
      headerName: "Group Name",
      flex: 1,
    },
  ];

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <Paper sx={{ p: 2, width: 500, maxWidth: "100%" }}>
      <Typography variant="h6" gutterBottom>
        User Group List
      </Typography>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.GROUP_ID}
        autoHeight
        pageSizeOptions={[5]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        disableRowSelectionOnClick
      />
    </Paper>
  );
}
