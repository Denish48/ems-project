import React, { useEffect, useState } from "react";
import {
  Card, Image,
  Row, Col, List, Button, Table, message, Tag
} from "antd";
import Service from "../../service";
import Avatar from "antd/lib/avatar/avatar";
import moment from "moment";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
const EmployeeView = (props) => {
  // console.log("props", props);
  const [empView, setEmpView] = useState(null);
  const [empApiData, setEmpApiData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const id = props.match.params.id;
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  // const id = props.match.params.id;
  useEffect(() => {
    getEmpView();
    getEmployeeById();
  }, [pagination.current, pagination.pageSize])
  const getEmpView = async () => {
    try {
      // const params=`${id}`
      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
        user_id: id

      };
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.employeeView,
        body: reqBody
      });
      if (response.data && response.data.data) {
        const empDetails = response.data.data;
        setEmpView(empDetails);
      }
      else {
        message.error("Something went wrong")
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getEmployeeById = async () => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.employeebyId + params,

      });
      if (response.data && response.data.data) {
        console.log("emp data view", response.data.data);
        setEmpApiData(response.data.data);
        if (response.data.data.user_img && response.data.data.user_img.length > 0) {
          let url;
          if (response.data.data.user_img.includes('base64')) {
            url = response.data.data.user_img;
          } else {
            url = `${Service.Server_Base_URL}/uploads/user_images/${response.data.data.user_img}`
          }
          const file = {
            uid: Service.uuidv4(),
            name: response.data.data.user_img,
            status: 'done',
            url
          };
          // fileList.push(file);
          // setFileList([...fileList]);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'event_name',
      key: 'event_name',
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>
          {record?.event?.event_name}
        </span>
      ),
    },
    {
      title: "Event Type",
      dataIndex: "event_type",
      key: "name",
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>
          {record?.event?.event_type?.event_type}
        </span>
      ),
    },
    {
      title: "Time/Date",
      dataIndex: "date",
      key: "time_date",
      render: (text, record, index) => {
        if (!record?.event?.start_date) return null;
        const date = new Date(record?.event?.start_date);
        return <span>{date.toDateString()}</span>;
      },
    },
    // {
    //   title: "Feedback",
    //   dataIndex: "action",
    //   render: (text, record, index) => (
    //     <div
    //       style={{
    //         display: "flex",
    //         flexwrap: "wrap",
    //       }}
    //     >
    //       <Link type="button" to={`/feedback-view/${record._id}`}>
    //         <Button type="link success" title="View">
    //           <EyeOutlined
    //             style={{ fontSize: "18px" }}
    //           />
    //         </Button>
    //       </Link>


    //     </div>
    //   ),
    // },
  ];
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/dashboard');
    }
  };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  }
  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }
  var getInitials = function (string) {
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
  if (empApiData?.birthdate) {
    const date = new Date(empApiData?.birthdate);
    var datestring = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear()
  }

  console.log("date", empApiData?.birthdate);
  return (
    <>
      <Card title="Employee View">
        <Row>
          <Col span={24} >
            <Button type="primary" style={{ float: "right" }} onClick={onCancel}>
              Back
            </Button>
          </Col>
          <Col style={{ boxShadow: "0 0 5px 5px rgb(0 0 0 / 3%)", marginBottom: "32px", borderRadius: "10px" }}
            span={14} md={16} sm={16} xs={24}>
            <List
              itemLayout="horizontal"
            >
              <List.Item>Employee Name : {empApiData?.first_name + " " + empApiData?.last_name}
              {/* <button onClick="http://localhost:8888/api/employees/employeesByIdForImage/61389b253c9448142cc35f12" /> */}
              </List.Item>
              <List.Item>Credits : {empApiData?.credits}</List.Item>
              <List.Item>Email : {empApiData?.email}</List.Item>
              <List.Item>Department Name : {empApiData?.department_id?.department_name}</List.Item>

              {datestring && <List.Item>Birthdate : {datestring}</List.Item>}

            </List>
          </Col>
          <Col style={{ marginTop: "25px" }} md={8} sm={8} xs={24}>
            {
              empApiData?.user_img ?
                <Avatar className={'employee_profile_wrapper'} size={{
                  xs: 24,
                  sm: 32,
                  md: 40,
                  lg: 64,
                  xl: 150,
                  xxl: 100,
                }}
                  src={`${Service.Server_Base_URL}/uploads/user_images/${empApiData?.user_img}`}
                /> : <Avatar className={'employee_profile_wrapper'} size={{
                  xs: 24,
                  sm: 32,
                  md: 40,
                  lg: 64,
                  xl: 150,
                  xxl: 100,
                }}>{getInitials(empApiData?.first_name + " " + empApiData?.last_name)}</Avatar>

            }
          </Col>
        </Row>
      </Card>


      <Card>
        <Table columns={columns}
          dataSource={empView}
          pagination={
            {
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "30"],
              ...pagination
            }
          }
          footer={getFooterDetails}
          onChange={handleTableChange}

        />
      </Card>
          
    </>
  );
};
export default EmployeeView;
