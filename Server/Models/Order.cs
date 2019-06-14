using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("order", Schema="catalog")]
    public class Order
    {        
        [Column("order_id")]
        public int Id { get; set; }
        [Column("order_number")]
        public string Number { get; set; }
        [Column("order_contract_number")]
        public string ContractNumber { get; set; }
        [Column("order_create_date")]
        public DateTime CreateDate { get; set; }
        [Column("order_complete_date")]
        public DateTime CompleteDate { get; set; }
        [Column("client_id")]
        public int ClientId { get; set; }
        public Client Client { get; set; }
        [Column("manager_id")]
        public int ManagerId { get; set; }
        [Column("order_state_id")]
        public int StateId { get; set; }
        [Column("order_source_id")]
        public int SourceId { get; set; }
        [Column("theme")]
        public string Theme { get; set; }
        [Column("contract_date")]
        public DateTime ContractDate { get; set; }
        [Column("account_number")]
        public string AccountNumber { get; set; }
        [Column("date_payment")]
        public DateTime DatePayment { get; set; }
        [Column("date_act")]
        public DateTime DateAct { get; set; }
        [Column("value_added_tax")]
        public int ValueAddedTax { get; set; }
        [Column("contact_amount")]
        public int ContactAmount { get; set; }
        [Column("comment")]
        public string Comment { get; set; }
    }
}
