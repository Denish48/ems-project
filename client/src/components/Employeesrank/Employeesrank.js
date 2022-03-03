import React, { useEffect, useState } from "react";

import Widget from "components/Widget";
import DashboardEmpView from "../DashboardEmp/DashboardEmp";
import Service from "../../service";

const Employeesrank = () => {
  const [topempData, setTopEmp] = useState([]);

  useEffect(() => {
    getTopEmpList();
  }, []);

  const getTopEmpList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employeesrank,
        body: {
          pageLimit: 5
        }
      });
      if (response.data && response.data.data) {
        const topEmp = [];
        for (const element of response.data.data) {
          if (element.credits) {
            topEmp.push(element);
          }
        }
        setTopEmp(topEmp);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  return (
    <Widget title={
      <h2 className="h4 gx-text-capitalize gx-mb-0">
        Top Employees</h2>
    } styleName="gx-card-ticketlist">
      {
        topempData.length > 0 ?
          topempData.map((data, index) => (
            <DashboardEmpView key={index} data={data} />
          ))
          :
          <>No Employees got rank yet</>
      }
      {/* <div className="gx-task-list-item gx-d-block gx-d-sm-none"><h5
        className="gx-text-primary gx-mb-0 gx-pointer">See all tickets <i
          className="icon icon-long-arrow-right gx-fs-xxl gx-ml-2 gx-d-inline-flex gx-vertical-align-middle" /></h5>
      </div> */}
    </Widget>
  );
}


export default Employeesrank;
