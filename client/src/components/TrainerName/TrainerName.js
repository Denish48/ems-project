import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Input,
  Table,
  Modal,
  Button,
  Form,
  Menu,
  Card,
  Popconfirm,
  Dropdown,
  Tag,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import Service from "../../service";

const Search = Input.Search;

const TrainerName = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);
  const [deptData, setDeptData] = useState([]);
  const [hostData, setHostData] = useState([]);
  // const [q, setQ] = useState("");
  const searchRef = useRef();

  useEffect(() => {
    getHostlist();
    getDepartmentList();
  }, [searchText, pagination.current, pagination.pageSize]);

  const getHostlist = async () => {
    // dispatch(showAuthLoader());
    try {
      const reqBody = {
        pageNum: pagination.current,
        pageLimit: pagination.pageSize,
      };

      if (searchText && searchText !== "") {
        reqBody.search = searchText;
        setSearchEnabled(true);
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.hostlist,
        body: reqBody
      });
      if (response.data && response.data.data?.length > 0) {
        console.log("getHostlist", response.data.data);
        const hostDetails = response.data.data
        setPagination({
          ...pagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setHostData(hostDetails)

      } else {
        setHostData([]);
        setPagination({
          ...pagination,
          total: 0,
        });
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
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
      }
      else {
        message.error("Something went wrong")
      }
    } catch (error) {
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
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };
  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  const resetSearchFilter = (e) => {
    const keyCode = e && e.keyCode ? e.keyCode : e;
    switch (keyCode) {
      case 8:
        if (searchRef.current.state?.value?.length <= 1 && seachEnabled) {
          searchRef.current.state.value = '';
          setSearchText('');
          setSearchEnabled(false);
        }
        break;
      case 46:
        if (searchRef.current.state?.value?.length <= 1 && seachEnabled) {
          searchRef.current.state.value = '';
          setSearchText('');
          setSearchEnabled(false);
        }
        break;
      default:
        break;
    }
  }

  const columns = [
    {
      title: "Host Name",
      dataIndex: "full_name",
      key: "name",
      render: (text, record, index) => (
        <Link type="button" to={`/host/view-host/${record._id}`}> <span style={{ textTransform: "capitalize", color: "black" }}>{record?.full_name}</span>
        </Link>
      ),
    },

    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text, record, index) => (
        <span>
          {record?.email}
        </span>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text, record, index) => (
        <span>
          <Tag>{record?.department?.department_name}</Tag>
        </span>
      ),
    },

    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    // {
    //   title: "Actions",
    //   dataIndex: "action",
    //   render: (text, record, index) => (
    //     <div
    //       style={{
    //         display: "flex",
    //         flexwrap: "wrap",
    //       }}
    //     >
    //       <Button type="link success" onClick={() => openUserModal()}>
    //         <EditOutlined style={{ fontSize: '18px' }} />
    //       </Button>

    //       <Link type="button" to={`/host/view-host/${record._id}`}>
    //         <Button type="link success" title="View" >
    //           <EyeOutlined style={{ fontSize: "18px" }} />
    //         </Button>
    //       </Link>
    //     </div>
    //   ),
    // },
  ];

  // const searchh = (rows) => {
  //   const columns = rows[0] && Object.keys(rows[0]);
  //   return rows.filter((row) =>
  //     columns.some(
  //       (column) =>
  //         row[column].toString().toLowerCase().indexOf(q.toLowerCase()) > -1
  //     )
  //   );
  // };

  return (
    <>
      <Card title="Hosts">
        <Search
          ref={searchRef}
          placeholder="Search..."
          onSearch={onSearch}
          onKeyUp={resetSearchFilter}
          style={{ width: 200 }}
          className='mr2'
        />
        {/* <Link to="/add-trainer">
          <Button type="primary" style={{ float: "right" }}>
            Add TrainerName
          </Button>
        </Link> */}
        <Table
          pagination={
            {
              showSizeChanger: true,
              total: ["10,20,30,40"],
              ...pagination
            }
          }
          onChange={handleTableChange}
          footer={getFooterDetails}
          columns={columns}
          dataSource={hostData} />
      </Card>
    </>
  );
};

export default TrainerName;
