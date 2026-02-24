import { Box, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/ModeEditOutlineRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid } from "@mui/x-data-grid";

/**
 * ModuleGrid
 * Displays the list of module records in a data grid
 * with inline edit and delete action buttons per row.
 *
 * Props:
 *   rows     - Array of module objects fetched from the API.
 *   onEdit   - Callback invoked with the row data when the edit icon is clicked.
 *   onDelete - Callback invoked with the row data when the delete icon is clicked.
 *   loading  - Boolean flag to show the grid loading skeleton while data is fetching.
 */
export default function ModuleGrid({ rows, onEdit, onDelete, loading }) {
  // Column definitions for the data grid.
  // The actions column uses renderCell to inject icon buttons instead of data values.
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        // Action icons are centered vertically within the row cell
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            alignItems: "center",
            height: "100%",
          }}
        >
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(params.row)}>
              <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    // Displays the module name returned from the API
    { field: "module_name", headerName: "Module Name", width: 250 },
    // Displays the icon identifier string associated with the module
    { field: "icon", headerName: "Icon", width: 150 },
  ];

  return (
    <>
      <Box sx={{ pt: 2, maxwidth: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          // Uses the API-returned lowercase field as the unique row identifier
          getRowId={(row) => row.module_menu_id}
          autoHeight
          pageSizeOptions={[5, 10, 20]}
          disableRowSelectionOnClick
        />
      </Box>
    </>
  );
}
