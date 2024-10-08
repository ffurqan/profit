import connectToDatabase from "../../../lib/mongodb";
import Blog from "../../../Models/blogs";
import formidable from "formidable";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing
  },
};

export default async function handler(req, res) {
  const { method } = req;

  await connectToDatabase();

  switch (method) {
    case "GET":
      try {
        const blogs = await Blog.find({}); // Fetch all blogs
        res.status(200).json({ success: true, data: blogs });
      } catch (error) {
        console.error("Error fetching blogs:", error);
        res
          .status(400)
          .json({ success: false, message: "Failed to fetch blogs" });
      }
      break;

    case "POST":
      const form = formidable({
        uploadDir: path.join(process.cwd(), "public/uploads"),
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10 MB limit
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error parsing form data:", err);
          return res
            .status(400)
            .json({ success: false, message: "Error parsing form data" });
        }

        const title = fields.title ? fields.title[0] : "";
        const desc = fields.desc ? fields.desc[0] : "";
        const content = fields.content ? fields.content[0] : "";

        // Extract image paths
        const imagePaths = Object.values(files)
          .map((file) => {
            if (Array.isArray(file)) {
              return file.map((f) => f.filepath); // Handle multiple files
            }
            return file.filepath;
          })
          .flat();

        try {
          const blog = new Blog({
            title,
            content,
            desc,
            images: imagePaths,
          });

          await blog.save();
          res.status(201).json({ success: true, data: blog });
        } catch (error) {
          console.error("Failed to save blog:", error);
          res
            .status(400)
            .json({ success: false, message: "Failed to create blog" });
        }
      });
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
