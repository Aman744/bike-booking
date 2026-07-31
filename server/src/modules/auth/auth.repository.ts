import { Admin, IAdminDocument } from './admin.model';

export class AdminRepository {
  async findByEmail(email: string): Promise<IAdminDocument | null> {
    return Admin.findOne({ email });
  }

  async findById(id: string): Promise<IAdminDocument | null> {
    return Admin.findById(id);
  }

  async create(adminData: Partial<IAdminDocument>): Promise<IAdminDocument> {
    const admin = new Admin(adminData);
    return admin.save();
  }

  async countAdmins(): Promise<number> {
    return Admin.countDocuments();
  }

  async findAll(): Promise<IAdminDocument[]> {
    return Admin.find({});
  }

  async update(id: string, adminData: Partial<IAdminDocument>): Promise<IAdminDocument | null> {
    const admin = await Admin.findById(id);
    if (!admin) return null;
    
    // Assign fields dynamically
    Object.assign(admin, adminData);
    return admin.save(); // save triggers pre-save password hashing if updated
  }

  async delete(id: string): Promise<IAdminDocument | null> {
    return Admin.findByIdAndDelete(id);
  }
}

export default AdminRepository;
