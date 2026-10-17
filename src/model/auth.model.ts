import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Gender, provider, role } from '../common/enums/index';
import { iAuth } from '../common/interface/auth.interface';
import { HydratedDocument, Types } from 'mongoose';
import { HashPassword } from 'common/utils/security/Hash';

@Schema({
  timestamps: true,
  strict: true,
})
export class Auth implements iAuth {
  
  @Prop({type: Types.ObjectId})
  _id!:Types.ObjectId

  @Prop({ type: String, required: true })
  username!: string;

  @Prop({ type: Number, required: true, min: 18, max: 60 })
  age!: number;

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, options: true })
  phone!: string;

  @Prop({
    type: String,
    required: true,
    minlength: 5,
    maxlength: 20,
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    enum: Object.values(Gender),
    default: Gender.male,
  })
  gender!: string;

  @Prop({
    type: String,
    enum: Object.values(role),
    default: role.user,
  })
  role!: string;

  @Prop({
    type: String,
    enum: Object.values(provider),
    default: provider.system,
  })
  provider!: string;

  @Prop({ type: Boolean, default: false })
  isverify!: boolean;
 
}

export const AuhtSchema = SchemaFactory.createForClass(Auth);
export const AuthModel = MongooseModule.forFeatureAsync([
  {
    name: Auth.name,
    useFactory: () => {
      const Schema = AuhtSchema;
     
      Schema.pre(
        'save',
        async function (this: HydratedDocument<iAuth> & { wasNew: boolean }) {
          this.wasNew = this.isNew;

          if (this.isModified('password')) {
            this.password = await HashPassword({ plainText: this.password });
          }
        },
      );
      return Schema;
    },
  },
]);
