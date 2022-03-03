import React, { useEffect, useState } from "react";
import {
  Card, Image,
  Row, Col, List, Button, Table, message, Tag
} from "antd";
import Service from "../../service";
const TrainerView = (props) => {
  // console.log("props", props);
  const [hostview, setHostView] = useState(null);
  const [empApiData, setEmpApiData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const id = props.match.params.id;
  // const id = props.match.params.id;
  useEffect(() => {
    getEmpView();
    getEmployeeById();
    getDepartmentList();
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
        api_url: Service.hostMyEvents,
        body: reqBody
      });
      if (response.data && response.data.data) {
        const empDetails = response.data.data;
        console.log("empDetails", empDetails);
        setHostView(empDetails);
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
      }
      else {
        setHostView([]);
        setPagination({
          ...pagination,
          total: 0,
        });
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
  const getDepartmentList = async () => {
    try {
      const response = await Service.makeAPICall({
        methodName: Service.getMethod,
        api_url: Service.departmentDropdownList,
      });
      if (response.data && response.data.data) {
        const dept = response.data.data;
        setDeptData(dept);
      } else {
        message.error("Something went wrong")
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const onSearch = (value) => {
  //   setSearchText(value);
  //   setPagination({ ...pagination, current: 1 });
  // };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };
  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }

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
      title: "Department",
      dataIndex: "department",
      key: "name",
      render: (text, record, index) => {
        if (record?.departments?.length > 0) {
          if (record?.departments?.length === deptData.length) {
            return <Tag style={{ textTransform: "capitalize" }}>All</Tag>
          } else {
            return record?.departments.map((dept, index) => {
              const department = dept?.department_name;
              return <Tag key={index} style={{ textTransform: "capitalize" }}>{department}</Tag>
            });
          }
        } else {
          return null;
        }
      },
    },

    {
      title: "Credit",
      dataIndex: "credit",
      key: "name",
      render: (text, record, index) => (
        <span style={{ textTransform: "capitalize" }}>
          {record?.event?.credit}
        </span>
      ),
    },
  ];
  const onCancel = () => {
    if (props.history.length > 1) {
      props.history.goBack();
    } else {
      props.history.push('/dashboard');
    }
  };
  return (
    <>
      <Card title="Host View">
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
              <List.Item>Employee Name : {empApiData?.first_name + " " + empApiData?.last_name}</List.Item>
              <List.Item>Credits : {empApiData?.credits}</List.Item>
              <List.Item>Email : {empApiData?.email}</List.Item>
              <List.Item>Department Name : {empApiData?.department_id?.department_name}</List.Item>

            </List>
          </Col>
          <Col style={{ marginTop: "25px" }} md={8} sm={8} xs={24}>
            {
              empApiData?.user_img ?
                <Image
                  src={`${Service.Server_Base_URL}/uploads/user_images/${empApiData?.user_img}`}
                /> : null
            }
          </Col>
        </Row>
      </Card>


      <Card>
        <Table
          pagination={
            {
              showSizeChanger: true,
              total: ["10,20,30,40"],
              ...pagination
            }
          }
          onChange={handleTableChange}
          columns={columns}
          footer={getFooterDetails}
          dataSource={hostview}
        />
      </Card>

    </>
  );
};
export default TrainerView;
