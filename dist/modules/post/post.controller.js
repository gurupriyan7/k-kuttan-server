import { errorWrapper } from "../../middleware/errorWrapper.js";
import { responseUtils } from "../../utils/response.utils.js";
import { postService } from "./post.service.js";
import { getPaginationOptions } from "../../utils/pagination.utils.js";
import { ObjectId } from "../../constants/type.js";
import Post from "./post.model.js";
import { UserApprovalStatus } from "../../modules/user/user.enum.js";
import { PostCategoriesEnum } from "./post.enum.js";
const createPost = errorWrapper(async (req, res, next) => {
  const data = await postService.createPost({
    ...req.body,
    createdBy: req.user?._id,
  });
  return responseUtils.success(res, {
    data,
    status: 201,
  });
});
const getPostSequences = errorWrapper(async (req, res, next) => {
  console.log(req?.user?._id);
  const data = await postService.getPostSequences({
    query: {
      createdBy: new ObjectId(String(req?.user?._id)),
    },
  });
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const getAllPostsByUser = errorWrapper(async (req, res, next) => {
  const paginationOptions = getPaginationOptions({
    limit: req.query?.limit,
    page: req.query?.page,
  });
  let query = {
    createdBy: new ObjectId(req.user?._id),
    isDeleted: false,
  };
  const searchTerm = req.query?.searchTerm;
  if (searchTerm) {
    query = {
      ...query,
      $or: [
        {
          summary: {
            $regex: new RegExp(String(searchTerm)),
            $options: "i",
          },
        },
        {
          title: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
        {
          story: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
      ],
    };
  }
  const data = await postService.getAllPostsByUser({
    query: {
      ...query,
      ...(req.query?.category &&
        req?.query?.category !== PostCategoriesEnum.COMMON && {
          category: req.query?.category,
        }),
      ...(req.query?.isDraft &&
        req.query?.isDraft === "true" && {
          isDraft: true,
        }),
      ...(req.query?.isDraft &&
        req.query?.isDraft === "false" && {
          isDraft: false,
        }),
    },
    options: {
      ...paginationOptions,
      sort: { createdAt: -1 },
    },
  });
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const getAllPostsByUserId = errorWrapper(async (req, res, next) => {
  const paginationOptions = getPaginationOptions({
    limit: req.query?.limit,
    page: req.query?.page,
  });
  let query = {
    createdBy: new ObjectId(req.params?.id),
    isDeleted: false,
    isDraft: false,
    approvalStatus: UserApprovalStatus.APPROVED,
  };
  const searchTerm = req.query?.searchTerm;
  if (searchTerm) {
    query = {
      ...query,
      $or: [
        {
          summary: {
            $regex: new RegExp(String(searchTerm)),
            $options: "i",
          },
        },
        {
          title: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
        {
          story: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
      ],
    };
  }
  const data = await postService.getAllPostsByUser({
    query: {
      ...query,
      ...(req.query?.category && {
        category: req.query?.category,
      }),
    },
    options: {
      ...paginationOptions,
      sort: { createdAt: -1 },
    },
    userId: req.user?._id ?? "123456789",
  });
  console.log(data, "data----data---", req.params?.id);
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const updatePost = errorWrapper(async (req, res, next) => {
  // const data = await postService.createPost({
  //   ...req.body,
  //   createdBy: req.user?._id,
  //   role: req.user?.role,
  // });
  const data = await postService.updatePost(req?.params?.id, {
    ...req?.body,
    role: req.user?.role,
  });
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const updatePostLikeAndComment = errorWrapper(async (req, res, next) => {
  const data = await postService.updatePostLikeAndComment(req.params?.id, {
    ...req.body,
    userId: req.user?._id,
  });
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const findPostById = errorWrapper(async (req, res, next) => {
  const data = await postService.findPostById(
    req.params?.id,
    req?.user?._id ?? "1234",
  );
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const findSequencePosts = errorWrapper(async (req, res, next) => {
  const paginationOptions = getPaginationOptions({
    limit: req.query?.limit,
    page: req.query?.page,
  });
  const isDraft = req?.query?.isDraft;
  const postId = req?.params?.id;
  const postData = await Post.findOne({
    _id: new ObjectId(postId),
    isDeleted: false,
  });
  // console.log(postData,"post-Data-post-Data");
  let query = {
    isDeleted: false,
    partName: postData?.partName,
    "createdBy._id": new ObjectId(String(postData?.createdBy)),
    ...(!isDraft && {
      approvalStatus: UserApprovalStatus.APPROVED,
    }),
    ...(isDraft
      ? {
          isDraft: true,
        }
      : {
          isDraft: false,
        }),
  };
  const searchTerm = req.query?.searchTerm;
  if (searchTerm) {
    query = {
      ...query,
      $or: [
        {
          summary: {
            $regex: new RegExp(String(searchTerm)),
            $options: "i",
          },
        },
        {
          title: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
        {
          story: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
      ],
    };
  }
  const data = await postService.getAllPosts({
    query: {
      ...query,
      ...(req.query?.category &&
        req?.query?.category !== PostCategoriesEnum.COMMON && {
          category: req.query?.category,
        }),
    },
    options: {
      ...paginationOptions,
      sort: { partNumber: 1 },
    },
    userId: req.user?._id ?? "123456789",
  });
  console.log(data, "date-date-date-date");
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
const getAllPosts = errorWrapper(async (req, res, next) => {
  const paginationOptions = getPaginationOptions({
    limit: req.query?.limit,
    page: req.query?.page,
  });
  const isDraft = req?.query?.isDraft;
  const isMostLiked = req?.query?.isMostLiked;
  let query = {
    isDeleted: false,
    ...(!isDraft && {
      approvalStatus: UserApprovalStatus.APPROVED,
    }),
    ...(isDraft
      ? {
          isDraft: true,
        }
      : {
          isDraft: false,
        }),
  };
  const searchTerm = req.query?.searchTerm;
  if (searchTerm) {
    query = {
      ...query,
      $or: [
        {
          summary: {
            $regex: new RegExp(String(searchTerm)),
            $options: "i",
          },
        },
        {
          title: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
        {
          story: { $regex: new RegExp(String(searchTerm)), $options: "i" },
        },
      ],
    };
  }
  const data = await postService.getAllPosts({
    query: {
      ...query,
      ...(req.query?.category &&
        req?.query?.category !== PostCategoriesEnum.COMMON && {
          category: req?.query?.category,
        }),
      ...(req.query?.tag && {
        tag: req.query?.tag,
      }),
    },
    options: {
      ...paginationOptions,
      sort: { positionNumber: -1 },
    },
    userId: req.user?._id ?? "123456789",
    ...(isMostLiked && { isMostLiked: Boolean(isMostLiked) }),
  });
  return responseUtils.success(res, {
    data,
    status: 200,
  });
});
export {
  createPost,
  updatePost,
  getAllPostsByUser,
  updatePostLikeAndComment,
  getAllPosts,
  findPostById,
  getAllPostsByUserId,
  getPostSequences,
  findSequencePosts,
};
