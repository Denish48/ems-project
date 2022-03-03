import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Table,
  Button,
  Card,
  Popconfirm,
  message,
  Modal,
  Form,
  Upload,
  Tabs,
  Row,
  Select,
} from "antd";
import { Link } from "react-router-dom";
import Service from "../../service";
import imageCompression from "browser-image-compression";
import { useSelector } from "react-redux";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined
} from "@ant-design/icons";

const { TabPane } = Tabs;

const Birthday_model = () => {
  const [birthPagination, setBirthPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [achievmentPagination, setAchievmentPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [IsModalVisible, setIsModalVisible] = useState(false);
  const [postCardList, setPostCardList] = useState([]);
  const [viewTemplate, setviewTemplate] = useState({
    isModal: false,
    viewData: null
  })
  const [page, setPage] = useState([])
  const [birthdate, setBirthdate] = useState([]);
  const [imageUrlArr, setImageUrlArr] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const { authUser } = useSelector(({ auth }) => auth);
  useEffect(() => {
    getBirthdaylist();
  }, [birthPagination.current, birthPagination.pageSize]);

  {
    useEffect(() => {
      if (activeTab == '2') {
      getPostCardList()
    }}, [achievmentPagination.current, achievmentPagination.pageSize])
  }
  const [form] = Form.useForm();

  const getBirthdaylist = async () => {
    try {
      // dispatch(showAuthLoader());
      const reqBody = {
        pageNum: birthPagination.current,
        pageLimit: birthPagination.pageSize,
      };
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.birthdatelist,
        body: reqBody,
      });
      // dispatch(hideAuthLoader());
      if (response.data?.data?.length > 0) {
        setBirthPagination({
          ...birthPagination,
          total: response.data.metaData.totalFilteredCount,
        });
        setBirthdate(response.data.data);
      } else {
        setBirthPagination({
          ...birthPagination,
          total: 0,
        });
        setBirthdate([]);
        message.error(response.data.message);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  const birthHandleTableChange = (page, filters, sorter) => {
    setBirthPagination({ ...birthPagination, ...page });
  };

  const previewOfPostcardList = async (data) => {
    try {
      console.log(data);
      const body = {
        user_id: data.user_id._id,
        postCard_templete_id: data.postCard_templete_id._id
      }
      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.previewtemplete,
        body,
      });
      if (response.data) {
        setviewTemplate({ isModal: true, viewData: response.data })
      }
    } catch (error) {
      console.log(error);
    }

  }
  const viewTemplateClose = () => {
    setviewTemplate({ isModal: false, viewData: null })
  }

  const deletePostcard = async (id) => {

    try {
      const params = `/${id}`;
      const response = await Service.makeAPICall({
        methodName: Service.deleteMethod,
        api_url: Service.deletePostcardById + params,
      });
      if (response.data && response.data.data) {
        getPostCardList();
        message.success(response.data.message)
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
    }

  }

  const columns = [
    {
      title: "Name",
      dataIndex: "full_name",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        const full_name = record?.full_name;
        return (
          <span type="button" >
            {" "}
            <span style={{ textTransform: "capitalize" }}>{full_name}</span>
          </span>
        );
      },
    },
    {
      title: "Birthday",
      dataIndex: "birthdate",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        if (!record.birthdate) return null;
        const date = new Date(record?.birthdate);
        const datestring =
          date.getDate() +
          "-" +
          (date.getMonth() + 1) +
          "-" +
          date.getFullYear();

        return (
          <span style={{ textTransform: "capitalize" }}>{datestring}</span>
        );
      },
    },
  ];
  const columnsAchievement = [
    {
      title: "Employee Name",
      dataIndex: "full_name",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        const full_name = record?.user_id.first_name + " " + record?.user_id.last_name;
        return (
          <span style={{ textTransform: "capitalize" }}>{full_name}</span>

        );
      },
    },
    {
      title: "Achievement Name",
      dataIndex: "post_name",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        const templete_name = record?.postCard_templete_id?.templete_name;
        return (
          <span style={{ textTransform: "capitalize" }}>{templete_name}</span>
        );
      },
    },
    {
      title: "Achievement Date",
      dataIndex: "date",
      key: "name",
      editable: true,
      render: (text, record, index) => {
        if (!record?.post_date) return null;
        const date = new Date(record?.post_date);
        const datestring =
          date.getDate() +
          "-" +
          (date.getMonth() + 1) +
          "-" +
          date.getFullYear();
        return (
          <span style={{ textTransform: "capitalize" }}>{datestring}</span>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "action",
      render: (text, record, index) => (
        <div
          style={{
            display: "flex",
            flexwrap: "wrap",
          }}
        >

          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => deletePostcard(record._id)}
          >
            <Button type="link success" title="Delete">
              <DeleteOutlined style={{ fontSize: "18px" }} />
            </Button>
          </Popconfirm>

          <Link to='#' type="button">
            <Button type="link success" title="View"
              onClick={() => previewOfPostcardList(record)}
            >
              <EyeOutlined
                style={{ fontSize: "18px" }}
              />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const getBirthFooterDetails = () => {
    return (
      <label>
        Total Records Count is {birthPagination.total > 0 ? birthPagination.total : 0}
      </label>
    );
  };

  const getPostCardList = async () => {
    try {
      const reqBody = {
        pageNum: achievmentPagination.current,
        pageLimit: achievmentPagination.pageSize,
      };

      const response = await Service.makeAPICall({
        methodName: Service.postMethod,
        api_url: Service.postcardlist,
        body: reqBody,
      });
      if (response.data?.data?.length > 0) {
        setAchievmentPagination({
          ...achievmentPagination,
          total: response.data.metaData.totalPostCards,
        });
        setPostCardList(response.data.data);
      } else {
        setAchievmentPagination({
          ...achievmentPagination,
          total: 0,
        });
        setPostCardList([]);
        message.error(response.data.message);
      }
    } catch (error) {
      // dispatch(hideAuthLoader());
      console.log(error);
    }
  };

  function callback(key) {
    setActiveTab(key);
    if (key === "2") {
      getPostCardList();
      // setIsModalVisible(true);
    }
  }
  const AchievementHandleTableChange = (page, filters, sorter) => {
    setAchievmentPagination({ ...achievmentPagination, ...page });
  };
  const getAchievementFooterDetails = () => {
    return (
      <label>
        Total Records Count is {achievmentPagination.total > 0 ? achievmentPagination.total : 0}
      </label>
    );
  };
  const getCompressedFile = async (imageFile) => {
    const options = {
      maxSizeMB: 5,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  };
  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === "image/jpg" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLtM = file.size / 1024 / 1024 < 10;
    if (!isLtM) {
      message.error("Image must smaller than 10MB!");
    }
    return isJpgOrPng;
  };
  const handleChange = async (info) => {
    if (info.file.status === "uploading") {
      info.file.status = "done";
    }
    if (info.file.status === "done") {
      setFileList(info.fileList);
    }
  };
  const uploaderProps = {
    name: "file",
    listType: "picture-card",
    accept: "image/*",
    multiple: true,
    maxCount: 3,
    fileList: fileList,
    beforeUpload: beforeUpload,
    onChange: handleChange,
    customRequest: async ({ onSuccess, onError, file }) => {
      const compressedFile = await getCompressedFile(file);
      imageUrlArr.push({
        file,
        compressedFile: compressedFile,
      });
      setImageUrlArr([...imageUrlArr]);
      onSuccess("ok");
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const index_2 = imageUrlArr.findIndex(
        (item) => item.file?.uid === file.uid || item.uid === file.uid
      );
      if (index_2 > -1) {
        imageUrlArr.splice(index_2, 1);
        setImageUrlArr([...imageUrlArr]);
      }
      fileList.splice(index, 1);
      setFileList([...fileList]);
    },
  };
  const uploadButton = (
    <Upload {...uploaderProps}>
      {fileList.length < uploaderProps.maxCount && "+ Upload"}
    </Upload>
  );
  return (
    <>
      <Tabs activeKey={activeTab} defaultActiveKey="1" onChange={callback}>
        <TabPane tab="Employees Birthday" key="1">
          <Card title="Employees Birthday">
            {/* Birthday table data */}
            <Form form={form} component={false}>
              <Table
                pagination={{
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  ...birthPagination,
                  onChange(current) {
                    setPage(current)
                  }
                }}
                footer={getBirthFooterDetails}
                onChange={birthHandleTableChange}
                columns={columns}
                dataSource={birthdate}
              />
            </Form>
          </Card>
        </TabPane>
        <TabPane tab="Achievement" key="2">
          <Card title="Employees Achievment List">
            <Link to="/addPostcard">
              <Button type="primary" style={{ float: "right" }}>
                Add Achievement
              </Button>
            </Link>
            {/* Achievement table data */}
            <Form form={form} component={false}>
              <Table
                pagination={{
                  showSizeChanger: true,
                  pageSizeOptions: ["10", "20", "50"],
                  ...achievmentPagination,
                  onChange(current) {
                    setPage(current)
                  }
                }}
                footer={getAchievementFooterDetails}
                onChange={AchievementHandleTableChange}
                columns={columnsAchievement}
                dataSource={postCardList}
              />
            </Form>
            <Modal
              // title="Preview"
              width={1100}
              visible={viewTemplate && viewTemplate.isModal === true}
              okText="Update"
              footer={false}
              onCancel={viewTemplateClose}
            >
              <div dangerouslySetInnerHTML={{ __html: viewTemplate && viewTemplate?.viewData }}></div>
            </Modal>
          </Card>
        </TabPane>
      </Tabs>
    </>
  );
};

export default Birthday_model;
