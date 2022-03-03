import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Table,
  Button,
  Card,
  Popconfirm,
  message,
  Form
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import Service from "../../service";

import { useSelector } from 'react-redux';
const Search = Input.Search;

const DepartmentList = () => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");
  const [seachEnabled, setSearchEnabled] = useState(false);

  const searchRef = useRef();
  const { authUser } = useSelector(
    ({ auth }) => auth
  );
  const [DeptData, setDeptData] = useState([]);
  useEffect(() => {
    getDepartmentList();
  }, [searchText, pagination.current, pagination.pageSize]);

  const onSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };
  const handleTableChange = (page, filters, sorter) => {
    setPagination({ ...pagination, ...page });
  };

  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (record) => record._id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      department_name: '',
      ...record,
    });
    setEditingKey(record._id);
  };
  const getDepartmentList = async () => {
    try {
      // dispatch(showAuthLoader());
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
        api_url: Service.departmentList,
        body: reqBody
      });
      // dispatch(hideAuthLoader());
      if (response.data && response.data.data?.length > 0) {
        setPagination({
          ...pagination,
          total: response.data.metaData.totalDepartments,
        });
        setDeptData(response.data.data)
      } else {
        setPagination({
          ...pagination,
          total: 0,
        });
        setDeptData([])
        message.error(response.data.message)
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  }

  const DeleteDeparment = async (id) => {
    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.deleteDepartment + params,
        body: {
          user_id: authUser?._id,
        },
      });
      if (response.data && response.data.data) {
        getDepartmentList();
        message.success(response.data.message)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (id) => {
    try {
      //update to UI
      const row = await form.validateFields();
      const newData = [...DeptData];
      const index = newData.findIndex((item) => id === item._id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setDeptData(newData);
        let updatedRow;
        newData.map((data) => {
          if (id === data._id) {
            updatedRow = data;
          }
        });
        updatedRow = updatedRow.department_name;


        //save to database
        const params = `/${id}`;
        const response = await Service.makeAPICall({
          methodName: Service.putMethod,
          api_url: Service.editDepartment + params,
          body: {
            department_name: updatedRow,
            user_id: authUser?._id,
          },
        });
        setEditingKey('');
        if (response?.data?.data) {
          const msg = response.data.message;
          const index = Service.add_message(msg);
          if (index === -1) {
            message.success(msg).then(() => {
              Service.remove_message(msg);
            });
          }
        } else {
          const msg = response.data.message;
          const index = Service.add_message(msg);
          if (index === -1) {
            message.error(msg).then(() => {
              Service.remove_message(msg);
            });
          }
        }
        getDepartmentList()
      } else {
        newData.push(row);
        setDeptData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };
  const columns = [
    {
      title: "Department Name",
      dataIndex: "department_name",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        const department_name = record.department_name
        return <span style={{ textTransform: "capitalize" }}>{department_name}</span>
      },
    },

    {
      title: 'Actions',
      dataIndex: 'action',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <div
            style={{
              display: "flex",
              flexwrap: "wrap",
            }}
          >
            <span>
              <Button type="primary">
                <a
                  //href="javascript:;"
                  onClick={() => save(record._id)}
                >
                  Save
                </a></Button>
              <Button onClick={cancel}>Cancel</Button>
            </span>
          </div>
        ) : (
          <span>
            <div
              style={{
                display: "flex",
                flexwrap: "wrap",
              }}
            >
              <Button type="link success">
                <EditOutlined
                  style={{ fontSize: "18px" }}
                  onClick={() => edit(record)}
                  disabled={editingKey !== ""}
                />
              </Button>
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => DeleteDeparment(record._id)}
              >
                <Button type="link success" title="Delete">
                  <DeleteOutlined style={{ fontSize: "18px" }} disabled={editingKey !== ""} />
                </Button>
              </Popconfirm>
            </div>
          </span>
        );
      }
    },
  ];


  const EditableCell = ({
    editing,
    dataIndex,
    record,
    index,
    children,
    ...restProps
  }) => {
    return (

      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            rules={[
              {
                required: true,
                message: "Please enter department name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const getFooterDetails = () => {
    return (
      <label>
        Total Records Count is {pagination.total > 0 ? pagination.total : 0}
      </label>
    )
  }
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


  // const searchh = (rows) => {
  //   const columns = rows[0] && Object.keys(rows[0]);
  //   return rows.filter((row) =>
  //     columns.some(
  //       (column) =>
  //         row[column].toString().toLowerCase().indexOf(q.toLowerCase()) > -1
  //     )
  //   );
  // };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        dataIndex: col.dataIndex,
        editing: isEditing(record)
      })

    };
  });


  return (
    <>
      <Card title="Departments">
        <Search
          ref={searchRef}
          placeholder="Search..."
          onSearch={onSearch}
          onKeyUp={resetSearchFilter}
          style={{ width: 200 }}
        />
        <Link to="/department/add-department">
          <Button type="primary" style={{ float: "right" }}>
            Add Department
          </Button>
        </Link>
        <Form form={form} component={false}>
          <Table pagination={
            {
              showSizeChanger: true,
              
              ...pagination
            }
          }

            components={{
              body: {
                cell: EditableCell
              }
            }}
            footer={getFooterDetails}
            rowClassName="editable-row"
            onChange={handleTableChange}
            columns={mergedColumns}
            dataSource={DeptData}
          />
        </Form>
      </Card>
    </>
  );
};

export default DepartmentList;
