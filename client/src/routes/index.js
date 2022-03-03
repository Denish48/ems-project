import React, { lazy } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
// import Dashboard from "../components/dashboard/Dashboard";
const Dashboard = lazy(() => import('../components/dashboard/Dashboard'));
const Event = lazy(() => import('../components/Event/Event'));
const EditEvent = lazy(() => import('../components/EditEvent/EditEvent'));
const EmployeeList = lazy(() => import('../components/EmployeeList/EmployeeList'));
const DepartmentList = lazy(() => import('../components/DepartmentList/DepartmentList'));
const AddDepartment = lazy(() => import('../components/AddDepartment/AddDepartment'));
const NotificationEvent = lazy(() => import('../components/Notifaction/NotificationEvent'));
const AddNotification = lazy(() => import('../components/AddNotification/AddNotifiction'));
const AdminList = lazy(() => import('../components/AdminList/AdminList'));
const AddAdmin = lazy(() => import('../components/AddAdmin/AddAdmin'));
const AddEvent = lazy(() => import('../components/AddEvent/AddEvent'));
const EventTypeList = lazy(() => import('../components/EventTypeList/EventTypeList'));
const AddEventType = lazy(() => import('../components/AddEventType/AddEventType'));
const AddEmployee = lazy(() => import('../components/AddEmployee/AddEmployee'));
const EditEmployee = lazy(() => import('../components/EditEmployee/EditEmployee'));
const EditEventType = lazy(() => import('../components/EditEventType/EditEventType'));
const EditDepartment = lazy(() => import('../components/EditDepartment/EditDepartment'));
const AdminEdit = lazy(() => import('../components/AdminEdit/AdminEdit'));
const PreviousEvent = lazy(() => import('../components/PreviousEvent/PreviousEvent'));
const LiveEvent = lazy(() => import('../components/LiveEvent/LiveEvent'));
const EventView = lazy(() => import('../components/EventView/EventView'));
const UpComingEvent = lazy(() => import('../components/UpComingEvent/UpComingEvent'));
const AddTrainer = lazy(() => import('../components/AddTrainer/AddTrainer'));
// const EventTypeView = lazy(() => import('../components/EventTypeView/EventTypeView'));
const FeedbackView = lazy(() => import('../components/FeedbackView/FeedbackView'));
const EmployeeView = lazy(() => import('../components/EmployeeView/EmployeeView'));
const TrainerName = lazy(() => import('../components/TrainerName/TrainerName'));
const TrainerView = lazy(() => import('../components/TrainerView/TrainerView'));

const SurveyAdd = lazy(() => import('../components/SurveyAdd/SurveyAdd'));
const SurveyEdit = lazy(() => import('../components/SurveyEdit/SurveyEdit'));
const SurveyList = lazy(() => import('../components/SurveyList/SurveyList'));
const SurveyUsersList = lazy(() => import('../components/SurveyUsersList/SurveyUsersList'));
const SurveyAnsView = lazy(() => import('../components/SurveyAnsView/SurveyAnsView'));

const ElevateFormList = lazy(() => import('../components/ElevateFormList/ElevateFormList'));
const ElevateFormAdd = lazy(() => import('../components/ElevateFormAdd/ElevateFormAdd'));
const ElevateFormEdit = lazy(() => import('../components/ElevateFormEdit/ElevateFormEdit'));

const Birthday_model = lazy(() => import('../components/Birthday_module/Birthday_model'));
const AddPostCard = lazy(() => import('../components/AddPostCard/AddPostCard'));
const AddTemplate = lazy(() => import('../components/AddTemplate/AddTemplate'));


const App = ({ match }) => (
  <div className="gx-main-content-wrapper">
    <Switch>
      <Route exact path={`${match.url}dashboard`} component={Dashboard} />

      <Route exact path={`${match.url}event`} component={Event} />
      <Route exact path={`${match.url}event/add-event`} component={AddEvent} />
      <Route exact path={`${match.url}event/update-event/:id`} component={EditEvent} />
      <Route exact path={`${match.url}event/event-view/:id`} component={EventView} />
      <Route exact path={`${match.url}previous-event`} component={PreviousEvent} />
      <Route exact path={`${match.url}live-event`} component={LiveEvent} />

      <Route exact path={`${match.url}upcoming-event`} component={UpComingEvent} />

      <Route exact path={`${match.url}event-type`} component={EventTypeList} />
      <Route exact path={`${match.url}event-type/add-event-type`} component={AddEventType} />
      <Route
        exact path={`${match.url}event-type/update-event-type/:id`}
        component={EditEventType}
      />
      {/* <Route exact path={`${match.url}event-type/event-type-view/:id`} component={EventTypeView} /> */}

      <Route exact path={`${match.url}department`} component={DepartmentList} />
      <Route exact path={`${match.url}department/add-department`} component={AddDepartment} />
      <Route
        exact path={`${match.url}department/update-department/:id`}
        component={EditDepartment}
      />

      <Route exact path={`${match.url}employee`} component={EmployeeList} />
      <Route exact path={`${match.url}employee/add-employee`} component={AddEmployee} />
      <Route
        exact path={`${match.url}employee/update-employee/:id`}
        component={EditEmployee}
      />
      <Route exact path={`${match.url}employee/view-employee/:id`} component={EmployeeView} />

      <Route exact path={`${match.url}host`} component={TrainerName} />
      <Route exact path={`${match.url}add-trainer`} component={AddTrainer} />
      <Route exact path={`${match.url}host/view-host/:id`} component={TrainerView} />

      <Route exact path={`${match.url}elevate-forms`} component={ElevateFormList} />
      <Route exact path={`${match.url}elevate-forms/add`} component={ElevateFormAdd} />
      <Route exact path={`${match.url}elevate-forms/edit/:id`} component={ElevateFormEdit} />

      <Route exact path={`${match.url}elevate-forms/surveys-add`} component={SurveyAdd} />
      <Route exact path={`${match.url}elevate-forms/surveys-edit/:id`} component={SurveyEdit} />
      <Route exact path={`${match.url}elevate-forms/surveys`} component={SurveyList} />
      <Route exact path={`${match.url}elevate-forms/surveys/users/:id`} component={SurveyUsersList} />
      <Route exact path={`${match.url}elevate-forms/surveys/users/answers/:id`} component={SurveyAnsView} />

      <Route exact path={`${match.url}feedback-view/:id`} component={FeedbackView} />

      <Route exact path={`${match.url}admin-edit`} component={AdminEdit} />
      <Route exact path={`${match.url}add-admin`} component={AddAdmin} />
      <Route
        exact path={`${match.url}notification`}
        component={NotificationEvent}
      />
      <Route
        exact path={`${match.url}notification/add-notification`}
        component={AddNotification}
      />
      <Route exact path={`${match.url}birthday`} component={Birthday_model} />
      <Route exact path={`${match.url}addPostcard`} component={AddPostCard} />
      <Route exact path={`${match.url}templates`} component={AddTemplate} />


      <Route exact path={`${match.url}setting`} component={AdminList} />

      <Redirect from="/" to="/dashboard" />
      <Redirect from="*" to="/dashboard" />
    </Switch>
  </div>
);

export default App;
