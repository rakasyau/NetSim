/* ============================================================
 * templates.ts — Template konfigurasi siap pakai per vendor.
 * Dipakai di Config Editor: pilih template → apply ke node.
 * ============================================================ */

export type ConfigTemplate = {
  id: string;
  name: string;
  vendor: "mikrotik" | "cisco" | "linux";
  description: string;
  script: string;
};

export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  /* ---------------- Mikrotik (RouterOS) ---------------- */
  {
    id: "mikrotik-dhcp-server",
    name: "DHCP Server",
    vendor: "mikrotik",
    description: "DHCP server + pool + gateway di LAN",
    script: `# DHCP Server untuk LAN
/ip pool
add name=dhcp-pool ranges=192.168.1.100-192.168.1.200

/ip dhcp-server
add address-pool=dhcp-pool interface=bridge-local name=dhcp1

/ip dhcp-server network
add address=192.168.1.0/24 gateway=192.168.1.1 dns-server=192.168.1.1

# DNS forwarder
/ip dns
set allow-remote-requests=yes`,
  },
  {
    id: "mikrotik-nat",
    name: "NAT Masquerade",
    vendor: "mikrotik",
    description: "NAT masquerade internet untuk LAN",
    script: `# NAT Masquerade (internet sharing)
/ip firewall nat
add chain=srcnat out-interface=ether1 action=masquerade

# Rule dasar: izinkan established/related
/ip firewall filter
add chain=input connection-state=established,related action=accept
add chain=input action=drop in-interface=ether1`,
  },
  {
    id: "mikrotik-ospf",
    name: "OSPF Single Area",
    vendor: "mikrotik",
    description: "OSPF area 0 antar router",
    script: `# OSPF Single Area (backbone)
/routing ospf instance
add name=ospf1 router-id=10.0.0.1

/routing ospf area
add instance=ospf1 name=backbone area-id=0.0.0.0

/routing ospf interface-template
add networks=10.0.0.0/30 area=backbone
add networks=192.168.10.0/24 area=backbone`,
  },
  {
    id: "mikrotik-static-route",
    name: "Static Route",
    vendor: "mikrotik",
    description: "Route statis ke jaringan lain",
    script: `# Static route
/ip route
add dst-address=10.10.20.0/24 gateway=10.10.0.2
add dst-address=0.0.0.0/0 gateway=ether1`,
  },
  {
    id: "mikrotik-vlan",
    name: "VLAN di Bridge",
    vendor: "mikrotik",
    description: "VLAN 10 & 20 dengan interface VLAN di bridge",
    script: `# VLAN di bridge
/interface vlan
add name=vlan10 vlan-id=10 interface=bridge-local
add name=vlan20 vlan-id=20 interface=bridge-local

/interface bridge port
add bridge=bridge-local interface=ether2
add bridge=bridge-local interface=vlan10 pvid=10
add bridge=bridge-local interface=vlan20 pvid=20

/interface bridge vlan
add bridge=bridge-local tagged=bridge-local untagged=ether2 vlan-ids=10,20

/ip address
add address=10.10.10.1/24 interface=vlan10
add address=10.10.20.1/24 interface=vlan20`,
  },

  /* ---------------- Cisco (IOS) ---------------- */
  {
    id: "cisco-vlan",
    name: "VLAN + Inter-VLAN",
    vendor: "cisco",
    description: "VLAN 10 HR & 20 IT + SVI routing",
    script: `! VLAN HR & IT
vlan 10
 name HR
vlan 20
 name IT

! Access ports
interface Gi0/1
 switchport mode access
 switchport access vlan 10
interface Gi0/2
 switchport mode access
 switchport access vlan 20

! Trunk ke router
interface Gi0/3
 switchport mode trunk
 switchport trunk allowed vlan 10,20

! SVI (inter-VLAN routing)
interface Vlan10
 ip address 10.10.10.254 255.255.255.0
interface Vlan20
 ip address 10.10.20.254 255.255.255.0
ip routing`,
  },
  {
    id: "cisco-ospf",
    name: "OSPF Area 0",
    vendor: "cisco",
    description: "OSPF di router Cisco",
    script: `! OSPF Area 0
router ospf 1
 router-id 10.0.0.1
 network 10.0.0.0 0.0.0.3 area 0
 network 192.168.10.0 0.0.0.255 area 0

! Interface uplink
interface Gi0/1
 ip address 10.0.0.1 255.255.255.252
 no shutdown`,
  },
  {
    id: "cisco-ssh",
    name: "SSH + AAA Dasar",
    vendor: "cisco",
    description: "Aktifkan SSH & user admin",
    script: `! SSH server
hostname SW-HR
ip domain-name netsim.local
crypto key generate rsa modulus 2048
username admin privilege 15 secret admin123

line vty 0 4
 login local
 transport input ssh

ip ssh version 2`,
  },

  /* ---------------- Linux (netplan/systemd) ---------------- */
  {
    id: "linux-static-netplan",
    name: "Netplan Static IP",
    vendor: "linux",
    description: "Konfigurasi IP statis via netplan",
    script: `# /etc/netplan/01-netcfg.yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.10/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 1.1.1.1`,
  },
  {
    id: "linux-dhcp-server",
    name: "ISC DHCP Server",
    vendor: "linux",
    description: "DHCP server (isc-dhcp-server)",
    script: `# /etc/dhcp/dhcpd.conf
subnet 192.168.1.0 netmask 255.255.255.0 {
  range 192.168.1.100 192.168.1.200;
  option routers 192.168.1.1;
  option domain-name-servers 8.8.8.8, 1.1.1.1;
  default-lease-time 600;
  max-lease-time 7200;
}

# Aktifkan interface:
# /etc/default/isc-dhcp-server → INTERFACESv4="eth0"
# systemctl enable --now isc-dhcp-server`,
  },
  {
    id: "linux-dns-stub",
    name: "systemd-resolved Stub",
    vendor: "linux",
    description: "DNS stub + forwarder dasar",
    script: `# /etc/systemd/resolved.conf
[Resolve]
DNS=8.8.8.8 1.1.1.1
FallbackDNS=1.1.1.1
Domains=~.
DNSSEC=allow-downgrade

# systemctl restart systemd-resolved`,
  },
];

export function templatesForVendor(vendor: string): ConfigTemplate[] {
  return CONFIG_TEMPLATES.filter((t) => t.vendor === vendor);
}
