import React, { useEffect, useState } from "react";
import { Card, message, Table,Select } from "antd";
import Service from "../../service";
import { useDispatch } from "react-redux";
import {
  hideAuthLoader,
} from "../../appRedux/actions/Auth";
import { Link } from "react-router-dom";

import "./participate.css";
const ParticipateEmp = (props) => {

  const [participateUser, setParticipateUser] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const dispatch = useDispatch();
  const event_id = props.id;
  useEffect(() => {
    getEmployeeList();
  }, [pagination.current, pagination.pageSize])


  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };
  const getEmployeeList = async () => {

    try {
      if (event_id !== undefined) {
        const reqBody = {
          pageNum: pagination.current,
          pageLimit: pagination.pageSize,
          event_id
        };

        const response = await Service.makeAPICall({
          methodName: Service.postMethod,
          api_url: Service.participateUser,
          body: reqBody
        });
        console.log("response.data.data", response);
        if (response.data && response.data.data) {
          setPagination({
            ...pagination,
            total: response.data.metaData.totalFilteredCount,
          });
          setParticipateUser(response.data.data);
          // } else {
          //   setPagination({
          //     ...pagination,
          //     total: 0,
          //   });
          //   setParticipateUser([])
          //   message.error(response.data.message)

        }
      }

    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
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
      title: 'User Name',
      dataIndex: 'participateUser',
      key: 'id',
      render: (text, record, index) => {
        console.log(record,'record');
        if (record.totalUser.first_name && record.totalUser.last_name) {
          const first_name =
            record.totalUser.first_name
          const last_name =
            record.totalUser.last_name
          console.log("record[0]?._id", record);
          return <Link to={`/employee/view-employee/${record?.totalUser?._id}`}><span style={{ textTransform: "capitalize" }}>{first_name + " " + last_name}</span></Link>;

        } else {
          return null;
        }
      }
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: "Status",
      dataIndex: "isAccept",
      // key: "users",
      render: (text, record, index) => {
        console.log('record 2', record);
              
              return <span
              className={` ${record.isAccept==="accepted" ? 'accept' : 'deny'}`}  style={{ textTransform: "capitalize" }}>{record.isAccept}</span>
      },
    },
  ];

  return (
    <Card >
      <Table className="gx-table-responsive" pagination={
        {
          showSizeChanger: true,

          ...pagination
        }
      }
        footer={getFooterDetails}
        onChange={handleTableChange}
        columns={columns} dataSource={participateUser} />
    </Card>
  );
};

export default ParticipateEmp;
