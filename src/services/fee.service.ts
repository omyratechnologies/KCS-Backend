import { Fee, IFeeData } from "@/models/fee.model";

export class FeeService {
    // create fee
    public static readonly createFee = async (
        campus_id: string,
        user_id: string,
        data: {
            items: {
                fee_type: string;
                amount: number;
                name: string;
            }[];
            meta_data: object;
        }
    ) => {
        const fee = await Fee.create({
            campus_id,
            items: data.items,
            meta_data: data.meta_data,
            due_amount: data.items.reduce((acc, item) => acc + item.amount, 0),
            paid_amount: 0,
            payment_status: "unpaid",
            user_id,
            is_paid: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!fee) throw new Error("Fee not created");

        return fee;
    };

    // get fee by user_id
    public static readonly getFeeByUserId = async (user_id: string) => {
        const fee: {
            rows: IFeeData[];
        } = await Fee.find(
            { user_id, is_paid: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (fee.rows.length === 0) throw new Error("Fee not found");

        return fee.rows;
    };

    // update fee by id
    public static readonly updateFee = async (
        id: string,
        data: Partial<IFeeData>
    ) => {
        const fee = await Fee.updateById(id, data);

        if (!fee) throw new Error("Fee not updated");

        return fee;
    };
}
