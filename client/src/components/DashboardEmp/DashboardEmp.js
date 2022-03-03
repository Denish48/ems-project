import React from "react";
import { Avatar } from "antd";
import Service from "../../service";
import { Link } from "react-router-dom";

// import Aux from "../../util/Auxiliary";
// import {taskStatus} from "../TicketItemData/data"

// const getStatus = (status) => {
//   const statusData = taskStatus.filter((taskStatus, index) => status === taskStatus.id)[0];
//   return <Aux>
//     <span className="gx-nonhover">
//       {/* <i className={`icon icon-circle gx-fs-sm gx-text-${statusData.color}`}/> */}
//     </span>
//     {/* <span className={`gx-badge gx-hover gx-mb-0 gx-text-white gx-badge-${statusData.color}`}>
//       {statusData.title}
//     </span> */}
//   </Aux>
// };

const DashboardEmpView = ({ data }) => {

  // const {id, title, avatar, description, status} = data;
  const getInitials = function (string) {
    if (string.search(" ")) {
      var names = string.split(" "),
        initials = names[0].substring(0, 1).toUpperCase();

      if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
      }
      return initials;
    } else {
      // var names = string.split(' '),
      initials = string.substring(0, 1).toUpperCase();

      if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
      }
      return initials;
    }
  };


  return (
    <div key={"DashboardEmpView" + data._id} className="gx-media gx-task-list-item gx-flex-nowrap">
      {
        data?.user_img ?
          <Avatar className="gx-mr-3 gx-size-36" src={Service.Server_Base_URL + "/uploads/user_images/" + data?.user_img} /> :
          <Avatar className="gx-mr-3 gx-size-36" style={{ textTransform: "capitalize" }}>{getInitials(data.first_name + " " + data.last_name)}</Avatar>

      }

      <div className="gx-media-body gx-task-item-content">
        <div className="gx-task-item-content-left">
          <Link to={`/employee/view-employee/${data._id}`}>
            <h5 className="gx-text-truncate gx-task-item-title" style={{ textTransform: "capitalize" }}>{data.first_name + " " + data.last_name}</h5>
          </Link>
          <p key={data._id} className="gx-text-grey gx-fs-sm gx-mb-0">{data.credits}</p>
        </div>

      </div>
    </div>

  );
};

export default DashboardEmpView;
