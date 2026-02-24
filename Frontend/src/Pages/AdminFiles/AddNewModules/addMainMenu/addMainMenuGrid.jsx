import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEditOutlineRounded";
import {
  deleteAlert,
  showPostSuccess,
  showError,
} from "../../../../Components/swal_alert";
import { deleteMainMenu } from "../../../../Services/addMainMenu.services";
import { DataGrid } from "@mui/x-data-grid";

/**
 * AddMainmenuGrid
 * Displays the list of main menu entries in a data grid
 * with inline edit and delete actions per row.
 *
 * Props:
 *   rows     - Array of main menu records to display.
 *   onEdit   - Callback invoked with the row data when edit is clicked.
 *   onRefresh - Callback to reload the grid data after a delete.
 *   loading  - Boolean flag to show the grid loading skeleton.
 */
export default function AddMainmenuGrid({ rows, onEdit, onRefresh, loading }) {
  /**
   * Prompts the user for confirmation, then deletes the selected main menu entry.
   * Refreshes the grid and shows a success message on successful deletion.
   */
  const handleDelete = async (row) => {
    const result = await deleteAlert("Are you sure?", "Delete this main menu?");
    if (!result.isConfirmed) return;
    const res = await deleteMainMenu(row.main_menu_id);
    if (res?.Status === 1) {
      onRefresh?.();
      showPostSuccess("Deleted successfully");
    } else {
      showError("Failed to delete main menu. Please try again.");
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        // Action icons centered vertically within the row cell
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            height: "100%",
          }}
        >
          <ModeEditIcon
            fontSize="small"
            sx={{ cursor: "pointer", color: "primary.main" }}
            onClick={() => onEdit(params.row)}
          />
          <DeleteIcon
            fontSize="small"
            sx={{ cursor: "pointer", color: "error.main" }}
            onClick={() => handleDelete(params.row)}
          />
        </div>
      ),
    },
    { field: "main_menu_name", headerName: "Main Menu Name", width: 250 },
    { field: "icon", headerName: "Icon", width: 180 },
    { field: "module_name", headerName: "Module", width: 200 },
    {
      field: "page_name_navigation" || "null",
      headerName: "Page Navigation",
      width: 200,
      // Render empty string instead of "null" text for cleaner display
     renderCell: (params) => (params.value === null ? "null" : params.value),
    },
    { field: "position", headerName: "Position", width: 120 },
  ];

  return (
    <DataGrid
      sx={{ width: "85%" }}
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(row) => row.main_menu_id}
      autoHeight
      disableRowSelectionOnClick
    />
  );
}
