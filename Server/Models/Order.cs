using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("orders")]
    public class Order
    {
        public Order() { }
        [Key, Column("orderid")]
        public int Id { get; set; }
        [Column("ord_name")]
        public string Name { get; set; }
        [Column("custid")]
        public int CustomerId { get; set; }
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; }
        [Column("ts_open")]
        public DateTime OpenDate { get; set; }
        [Column("ts_closed")]
        public DateTime ClosedDate { get; set; }
        [Column("contract_id")]
        public string ContractId { get; set; }        
        public virtual List<Region> Regions { get; set; }
    }
}
