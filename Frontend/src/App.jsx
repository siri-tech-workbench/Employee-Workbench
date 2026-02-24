import { Routes, Route } from "react-router-dom";
import "./App.css";
import { MenuProvider } from "./Context/MenuContext";
import ProtectedRoute from "./utils/ProtectedRoute";

// Layout
import SheshaDrawer from "./Pages/Drawer";

// Public pages
import Login from "./Pages/Login";
import ResetPassword from "./Pages/Resetpassword";

// Admin pages
import AdminDashboard from "./Pages/AdminFiles/Admin/AdminDashboard";
import Employee from "./Pages/AdminFiles/Employee/Employee";
import Holiday from "./Pages/AdminFiles/Holiday/Holiday";
import UserCreation from "./Pages/AdminFiles/UserCreation/UserCreation";
import Customer from "./Pages/AdminFiles/Customer/Customer";
import LeaveAllotment from "./Pages/AdminFiles/LeaveAllotment/LeaveAllotment";
import SingleLeaveAllotmentMaster from "./Pages/AdminFiles/LeaveAllotment/singleLeaveAllotment/SingleLeaveAllotmentMaster";
import Leavedetail from "./Pages/AdminFiles/Leavedetail/EmployeeLeaveDetails";
import PendingLeaves from "./Pages/AdminFiles/Leaves/PendingLeaves";
import CompoffLeave from "./Pages/AdminFiles/Leaves/compoffLeave";
import NotificationType from "./Pages/AdminFiles/NotificationType/NotificationType";
import GeneralNotification from "./Pages/AdminFiles/GeneralNotification/GeneralNotification";
import NotificationTeam from "./Pages/AdminFiles/NotificationTeam/NotificationTeam";
import Project from "./Pages/AdminFiles/NewProjects/Project";
import ProjectTeam from "./Pages/AdminFiles/ProjectTeam/ProjectTeam";
import PermissionA from "./Pages/AdminFiles/AdminPermission/PermissionA";
import Break from "./Pages/AdminFiles/Break/Break";
import Module from "./Pages/AdminFiles/Module/Module";
import DragAndDrop from "./Pages/AdminFiles/DragAndDrop/DragAndDrop";
import Group from "./Pages/AdminFiles/Groups/GroupMaster";
import AddModuleMaster from "./Pages/AdminFiles/AddNewModules/addModule/addModuleMaster";
import AddMainmenuMaster from "./Pages/AdminFiles/AddNewModules/addMainMenu/addMainMenuMaster";
import AddMainmenuItemMaster from "./Pages/AdminFiles/AddNewModules/addMainMenuItem/addMainmenuItemMaster";
import SubMenuMaster from "./Pages/AdminFiles/AddNewModules/subMenu/SubMenuMaster";
import Tickets from "./Pages/AdminFiles/Tickets/tickets";
import AssignPage from "./Pages/AdminFiles/Tickets/assignticket";
import TicketProgressPage from "./Pages/AdminFiles/Tickets/ticketprogresspage";

// Employee pages
import EmpDashboard from "./Pages/EmpFiles/EmpDashboard/EmpDashboard";
import ApplyLeave from "./Pages/EmpFiles/ApplyLeave/ApplyLeave";
import ApplyCompoff from "./Pages/EmpFiles/ApplyCompoff/compoff";
import EmpPermission from "./Pages/EmpFiles/EmpPermission/EmpPermission";
import GeneralNotificationEmp from "./Pages/EmpFiles/GeneralNotificationEmp/GeneralNotificationEmp";
import SelfTask from "./Pages/EmpFiles/SelfTask/SelfTask";
import HolidayList from "./Pages/EmpFiles/HolidayList/HolidayList";
import KTClass from "./Pages/EmpFiles/KnowledgeTransfer/KTClass";

/**
 * App
 * Root component. Defines the full client-side route tree.
 *
 * Route structure:
 *   /                    — Login (public)
 *   /reset-password      — Reset Password (public, bypasses ProtectedRoute)
 *   /Drawer/*            — All authenticated pages wrapped in ProtectedRoute + SheshaDrawer layout
 */
function App() {
  return (
    <MenuProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected layout — all child routes require a valid auth token */}
        <Route
          path="/Drawer"
          element={
            <ProtectedRoute>
              <SheshaDrawer />
            </ProtectedRoute>
          }
        >
          {/* Default route inside the drawer — renders AdminDashboard at /Drawer */}
          <Route index element={<AdminDashboard />} />

          {/* Admin routes */}
          <Route path="AdminDashboard" element={<AdminDashboard />} />
          <Route path="Employee" element={<Employee />} />
          <Route path="DragAndDrop" element={<DragAndDrop />} />
          <Route path="Group" element={<Group />} />
          <Route path="Module" element={<Module />} />
          <Route path="Holiday" element={<Holiday />} />
          <Route path="UserCreation" element={<UserCreation />} />
          <Route path="Customer" element={<Customer />} />
          <Route path="LeaveAllotment" element={<LeaveAllotment />} />
          <Route
            path="SingleLeaveAllotmentMaster"
            element={<SingleLeaveAllotmentMaster />}
          />
          <Route path="Leavedetail" element={<Leavedetail />} />
          <Route path="PendingLeaves" element={<PendingLeaves />} />
          <Route path="compoffleave" element={<CompoffLeave />} />
          <Route path="NotificationType" element={<NotificationType />} />
          <Route path="GeneralNotification" element={<GeneralNotification />} />
          <Route path="NotificationTeam" element={<NotificationTeam />} />
          <Route path="Project" element={<Project />} />
          <Route path="ProjectTeam" element={<ProjectTeam />} />
          <Route path="PermissionA" element={<PermissionA />} />
          <Route path="Break" element={<Break />} />
          <Route path="AddModuleMaster" element={<AddModuleMaster />} />
          <Route path="AddMainmenuMaster" element={<AddMainmenuMaster />} />
          <Route path="AddMenuItemMaster" element={<AddMainmenuItemMaster />} />
          <Route path="SubMenuMaster" element={<SubMenuMaster />} />

          {/* Ticket management routes */}
          <Route path="tickets" element={<Tickets />} />
          <Route path="assign/:id" element={<AssignPage />} />
          <Route path="ticket-progress/:id" element={<TicketProgressPage />} />

          {/* Employee routes */}
          <Route path="EmpDashboard" element={<EmpDashboard />} />
          <Route path="ApplyLeave" element={<ApplyLeave />} />
          <Route path="compoff" element={<ApplyCompoff />} />
          <Route path="EmpPermission" element={<EmpPermission />} />
          <Route
            path="GeneralNotificationEmp"
            element={<GeneralNotificationEmp />}
          />
          <Route path="SelfTask" element={<SelfTask />} />
          <Route path="HolidayList" element={<HolidayList />} />
          <Route path="KTClass" element={<KTClass />} />
        </Route>
      </Routes>
    </MenuProvider>
  );
}

export default App;
